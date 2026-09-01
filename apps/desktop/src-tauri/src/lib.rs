use serde::{Deserialize, Serialize};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, State, WebviewWindow, WindowEvent,
};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

const EXPECTED_PROTOCOL_VERSION: u32 = 1;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct BackendSession {
    protocol_version: u32,
    base_url: String,
    token: String,
}

#[derive(Default)]
struct BackendState {
    child: Mutex<Option<CommandChild>>,
    session: Mutex<Option<BackendSession>>,
}

#[derive(Default)]
struct LifecycleState {
    quitting: AtomicBool,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct FloatWindowConfig {
    visible: bool,
    style: String,
}

impl Default for FloatWindowConfig {
    fn default() -> Self {
        Self {
            visible: false,
            style: "circle".into(),
        }
    }
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct FloatUploadContext {
    profile_id: String,
    bucket: String,
    region: Option<String>,
    prefix: String,
    rename: bool,
    overwrite: bool,
    use_https: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExpandedUploadFile {
    local_path: String,
    relative_path: String,
}

#[derive(Default)]
struct FloatWindowState {
    config: Mutex<FloatWindowConfig>,
    upload_context: Mutex<Option<FloatUploadContext>>,
    positioned: Mutex<bool>,
}

#[tauri::command]
async fn backend_session(state: State<'_, BackendState>) -> Result<BackendSession, String> {
    for _ in 0..100 {
        if let Some(session) = state
            .session
            .lock()
            .map_err(|_| "后端状态锁已损坏")?
            .clone()
        {
            return Ok(session);
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    Err("Go sidecar 启动超时".into())
}

#[tauri::command]
fn float_window_state(state: State<'_, FloatWindowState>) -> Result<FloatWindowConfig, String> {
    state
        .config
        .lock()
        .map_err(|_| "悬浮窗状态锁已损坏".into())
        .map(|config| config.clone())
}

#[tauri::command]
fn set_float_window(
    app: AppHandle,
    state: State<'_, FloatWindowState>,
    visible: bool,
    style: String,
) -> Result<FloatWindowConfig, String> {
    let (width, height) = match style.as_str() {
        "circle" => (67.0, 67.0),
        "oval" => (87.0, 30.0),
        _ => return Err("不支持的悬浮窗样式".into()),
    };
    let config = FloatWindowConfig { visible, style };
    *state.config.lock().map_err(|_| "悬浮窗状态锁已损坏")? = config.clone();

    let window = app.get_webview_window("float").ok_or("悬浮窗尚未创建")?;
    window
        .set_size(LogicalSize::new(width, height))
        .map_err(|error| format!("无法调整悬浮窗尺寸：{error}"))?;

    let should_position = {
        let mut positioned = state
            .positioned
            .lock()
            .map_err(|_| "悬浮窗位置状态锁已损坏")?;
        if *positioned {
            false
        } else {
            *positioned = true;
            true
        }
    };
    if should_position {
        position_float_window(&window, width, height)?;
    }

    app.emit("float-window-state", config.clone())
        .map_err(|error| format!("无法同步悬浮窗样式：{error}"))?;
    if visible {
        window
            .show()
            .map_err(|error| format!("无法显示悬浮窗：{error}"))?;
    } else {
        window
            .hide()
            .map_err(|error| format!("无法隐藏悬浮窗：{error}"))?;
    }
    Ok(config)
}

#[tauri::command]
fn set_float_upload_context(
    state: State<'_, FloatWindowState>,
    context: Option<FloatUploadContext>,
) -> Result<(), String> {
    if let Some(value) = &context {
        if value.profile_id.trim().is_empty() || value.bucket.trim().is_empty() {
            return Err("悬浮窗上传目标无效".into());
        }
    }
    *state
        .upload_context
        .lock()
        .map_err(|_| "悬浮窗上传状态锁已损坏")? = context;
    Ok(())
}

#[tauri::command]
fn float_upload_context(
    state: State<'_, FloatWindowState>,
) -> Result<Option<FloatUploadContext>, String> {
    state
        .upload_context
        .lock()
        .map_err(|_| "悬浮窗上传状态锁已损坏".into())
        .map(|context| context.clone())
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("主窗口尚未创建")?
        .hide()
        .map_err(|error| format!("无法隐藏主窗口：{error}"))
}

#[tauri::command]
fn open_directory(path: String) -> Result<(), String> {
    let path = std::fs::canonicalize(path).map_err(|error| format!("下载目录不可用：{error}"))?;
    if !path.is_dir() {
        return Err("下载位置不是文件夹".into());
    }

    #[cfg(target_os = "windows")]
    let mut command = Command::new("explorer");
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command
        .arg(path)
        .spawn()
        .map_err(|error| format!("无法打开下载目录：{error}"))?;
    Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    let url = url.trim();
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("只能打开 HTTP 或 HTTPS 地址".into());
    }

    #[cfg(target_os = "windows")]
    let mut command = Command::new("explorer");
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command
        .arg(url)
        .spawn()
        .map_err(|error| format!("无法在浏览器中打开地址：{error}"))?;
    Ok(())
}

#[tauri::command]
fn expand_upload_paths(paths: Vec<String>) -> Result<Vec<ExpandedUploadFile>, String> {
    let mut files = Vec::new();
    for raw_path in paths {
        let path = std::fs::canonicalize(&raw_path)
            .map_err(|error| format!("无法读取上传路径 {raw_path}：{error}"))?;
        let metadata = std::fs::symlink_metadata(&path)
            .map_err(|error| format!("无法读取上传路径信息：{error}"))?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_file() {
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .ok_or("上传文件名不是有效文本")?;
            files.push(expanded_upload_file(&path, Path::new(name))?);
        } else if metadata.is_dir() {
            let directory_name = path
                .file_name()
                .and_then(|value| value.to_str())
                .ok_or("上传文件夹名不是有效文本")?;
            collect_upload_files(&path, &path, Path::new(directory_name), &mut files)?;
        }
    }
    Ok(files)
}

fn collect_upload_files(
    directory: &Path,
    root: &Path,
    root_name: &Path,
    files: &mut Vec<ExpandedUploadFile>,
) -> Result<(), String> {
    let entries =
        std::fs::read_dir(directory).map_err(|error| format!("无法读取上传文件夹：{error}"))?;
    for entry in entries {
        let entry = entry.map_err(|error| format!("无法读取上传文件：{error}"))?;
        let path = entry.path();
        let metadata = entry
            .file_type()
            .map_err(|error| format!("无法读取上传文件类型：{error}"))?;
        if metadata.is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            collect_upload_files(&path, root, root_name, files)?;
        } else if metadata.is_file() {
            let relative = path
                .strip_prefix(root)
                .map_err(|_| "无法计算上传相对路径")?;
            files.push(expanded_upload_file(&path, &root_name.join(relative))?);
        }
    }
    Ok(())
}

fn expanded_upload_file(path: &Path, relative: &Path) -> Result<ExpandedUploadFile, String> {
    let local_path = path.to_str().ok_or("上传路径不是有效文本")?.to_owned();
    let relative_path = relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/");
    Ok(ExpandedUploadFile {
        local_path,
        relative_path,
    })
}

#[tauri::command]
fn prepare_download_path(base_directory: String, relative_path: String) -> Result<String, String> {
    let base = std::fs::canonicalize(base_directory)
        .map_err(|error| format!("下载目录不可用：{error}"))?;
    if !base.is_dir() {
        return Err("下载位置不是文件夹".into());
    }
    let relative = PathBuf::from(relative_path);
    if relative.as_os_str().is_empty()
        || relative.is_absolute()
        || relative
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err("下载文件相对路径无效".into());
    }
    let destination = base.join(relative);
    if let Some(parent) = destination.parent() {
        std::fs::create_dir_all(parent).map_err(|error| format!("无法创建下载文件夹：{error}"))?;
    }
    destination
        .to_str()
        .map(ToOwned::to_owned)
        .ok_or_else(|| "下载路径不是有效文本".into())
}

#[tauri::command]
fn quit_app(app: AppHandle, state: State<'_, LifecycleState>) {
    state.quitting.store(true, Ordering::SeqCst);
    app.exit(0);
}

fn show_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("主窗口尚未创建")?;
    window
        .unminimize()
        .map_err(|error| format!("无法还原主窗口：{error}"))?;
    window
        .show()
        .map_err(|error| format!("无法显示主窗口：{error}"))?;
    window
        .set_focus()
        .map_err(|error| format!("无法聚焦主窗口：{error}"))
}

fn toggle_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("主窗口尚未创建")?;
    if window
        .is_visible()
        .map_err(|error| format!("无法读取主窗口状态：{error}"))?
    {
        window
            .hide()
            .map_err(|error| format!("无法隐藏主窗口：{error}"))
    } else {
        show_main_window(app)
    }
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let menu = MenuBuilder::new(app)
        .text("show", "显示主窗口")
        .text("float", "显示/隐藏悬浮窗")
        .text("settings", "设置")
        .separator()
        .text("quit", "退出")
        .build()?;
    let mut tray = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .tooltip("OSS Client")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => {
                let _ = show_main_window(app);
            }
            "settings" => {
                if show_main_window(app).is_ok() {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("navigate-to-settings", ());
                    }
                }
            }
            "float" => {
                let state = app.state::<FloatWindowState>();
                let config = state.config.lock().ok().map(|value| value.clone());
                if let Some(config) = config {
                    let _ = set_float_window(app.clone(), state, !config.visible, config.style);
                }
            }
            "quit" => {
                app.state::<LifecycleState>()
                    .quitting
                    .store(true, Ordering::SeqCst);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = toggle_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon().cloned() {
        tray = tray.icon(icon);
    }
    tray.build(app)?;
    Ok(())
}

fn position_float_window(window: &WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    let Some(monitor) = window
        .primary_monitor()
        .map_err(|error| format!("无法读取主显示器：{error}"))?
    else {
        return Ok(());
    };
    let scale = monitor.scale_factor();
    let work_area = monitor.work_area();
    let margin = (100.0 * scale).round() as i32;
    let physical_width = (width * scale).round() as i32;
    let physical_height = (height * scale).round() as i32;
    let x = work_area.position.x + work_area.size.width as i32 - physical_width - margin;
    let max_y = work_area.position.y + work_area.size.height as i32 - physical_height;
    let y = (work_area.position.y + margin).min(max_y);
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|error| format!("无法设置悬浮窗位置：{error}"))
}

fn start_sidecar(app: AppHandle) -> Result<(), String> {
    let command = app
        .shell()
        .sidecar("oss-sidecar")
        .map_err(|error| format!("无法创建 Go sidecar 命令：{error}"))?;
    let (mut events, child) = command
        .spawn()
        .map_err(|error| format!("无法启动 Go sidecar：{error}"))?;

    *app.state::<BackendState>()
        .child
        .lock()
        .map_err(|_| "后端进程锁已损坏")? = Some(child);

    tauri::async_runtime::spawn(async move {
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let parsed = serde_json::from_slice::<BackendSession>(&bytes);
                    if let Ok(session) = parsed {
                        if session.protocol_version != EXPECTED_PROTOCOL_VERSION
                            || !session.base_url.starts_with("http://127.0.0.1:")
                            || session.token.len() < 32
                        {
                            eprintln!("Go sidecar 返回了无效的启动信息");
                            continue;
                        }

                        if let Ok(mut state) = app.state::<BackendState>().session.lock() {
                            *state = Some(session);
                        }
                    }
                }
                CommandEvent::Stderr(bytes) => {
                    eprintln!("Go sidecar: {}", String::from_utf8_lossy(&bytes));
                }
                CommandEvent::Terminated(_) => {
                    if let Ok(mut session) = app.state::<BackendState>().session.lock() {
                        *session = None;
                    }
                    if let Ok(mut child) = app.state::<BackendState>().child.lock() {
                        *child = None;
                    }
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .manage(BackendState::default())
        .manage(FloatWindowState::default())
        .manage(LifecycleState::default())
        .setup(|app| {
            setup_tray(app)?;
            start_sidecar(app.handle().clone())
                .map_err(|error| -> Box<dyn std::error::Error> { error.into() })?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            if let WindowEvent::CloseRequested { api, .. } = event {
                let lifecycle = window.state::<LifecycleState>();
                if !lifecycle.quitting.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            backend_session,
            float_window_state,
            set_float_window,
            set_float_upload_context,
            float_upload_context,
            hide_main_window,
            open_directory,
            open_external_url,
            expand_upload_paths,
            prepare_download_path,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("运行 OSS Client 失败");
}
