# OSS Client Design System

这份规范是桌面端视觉实现的唯一依据。随机渐变属于画布层；组件必须通过语义 token 叠加在画布上，不能针对某一套背景单独写死颜色。

## 设计原则

1. **保留背景生命力**：页面和侧边栏使用原有随机渐变，面板不得用接近纯色的背景遮住它。
2. **层级决定透明度**：越靠近用户的浮层越清晰，但只有弹窗可以使用较高不透明度。
3. **语义优先**：业务页面只描述“面板、主要按钮、弱文字”，不直接决定颜色值。
4. **对比度由文字层级保证**：不要通过把卡片变得不透明来修复文字难以辨认。
5. **同类组件一致**：Button、Card、Input、Select、Dialog 等视觉只能在 shadcn 基础组件中修改。

## 视觉层级

| 层级     | Token / 组件                        | 用途               | 基础不透明度 |
| -------- | ----------------------------------- | ------------------ | ------------ |
| Canvas   | 随机主题渐变                        | 页面背景           | 100%         |
| Subtle   | `surface-subtle`                    | 新增卡片、轻提示   | 4.5% 白色    |
| Panel    | `surface-panel` / `.ds-panel`       | 设置卡片、配置卡片 | 54% 深色     |
| Elevated | `surface-elevated` / `.ds-elevated` | Select、Tooltip    | 62% 深色     |
| Dialog   | `surface-dialog`                    | 编辑与确认弹窗     | 68% 深色     |
| Scrim    | `surface-scrim`                     | 弹窗遮罩           | 18% 黑色     |

## 按钮层级

| Variant       | 语义       | 规则                                               |
| ------------- | ---------- | -------------------------------------------------- |
| `default`     | 主要操作   | 更实，22% 白色背景；只用于上传、保存、确认等主动作 |
| `secondary`   | 次要操作   | 更透，10% 白色背景；用于下载、选择、取消、编辑     |
| `outline`     | 弱边界操作 | 默认透明，仅显示边框                               |
| `ghost`       | 工具操作   | 默认无背景，悬停时出现 8% 白色                     |
| `destructive` | 危险操作   | 低透明红色，仅用于删除、清空等不可逆动作           |

一个操作区只能有一个主要按钮。主要按钮和次要按钮不能通过页面级 `className` 改写颜色或透明度。

## 文字层级

| Token            | 不透明度 | 用途                   |
| ---------------- | -------- | ---------------------- |
| `text-primary`   | 92%      | 标题、字段值、主要正文 |
| `text-secondary` | 74%      | 次要正文、按钮文本     |
| `text-muted`     | 56%      | 描述、标签、辅助信息   |
| `text-disabled`  | 34%      | 禁用状态               |

不要在业务页面使用 `text-foreground/65` 一类临时比例；请选择最接近的语义层级。

## 边框与状态

| Token            | 不透明度 | 用途                 |
| ---------------- | -------- | -------------------- |
| `border-subtle`  | 8%       | 分隔线、弱边界       |
| `border-default` | 13%      | 卡片、输入框         |
| `border-strong`  | 22%      | 选中、悬停、重点边界 |
| `ring`           | 48%      | 键盘焦点             |

所有交互控件必须保留 hover、focus-visible、disabled 和 invalid 状态。
聚焦的 Field 必须提升到相邻表单行之上；控件直接使用 `ring` token，不得再次降低透明度，避免外发光被相邻表面遮挡。

## 组件使用规则

- 页面级面板优先使用 `Card`；设置组等无 Card 结构的面板使用 `.ds-panel`。
- 下拉菜单、Tooltip 等临时浮层使用 elevated 层。
- 表单编辑使用 `Dialog`，危险确认使用 `AlertDialog`。
- Dialog Footer 继承弹窗的 `surface-dialog`，仅使用分隔线划分操作区，不得叠加新的表面背景。
- 输入控件统一使用 shadcn `Input`、`InputGroup`、`Select`、`Switch`、`RadioGroup`。
- 编辑表单使用 `Field orientation="responsive"`：窄窗口单列展示，中等及以上窗口采用固定标签列和最大 28rem 的输入列，整组靠左排列。
- 带较长说明文字的设置项使用 `Field orientation="responsive-description"`，在中等及以上窗口采用均衡两列。
- 服务商 Logo 的品牌色可以保留；布局背景、文字、边框与状态色必须使用语义 token。
- 禁止在 `app` 和 `features` 中新增 `bg-[#...]`、`bg-white/...`、`bg-black/...` 等视觉硬编码。

## 修改流程

1. 先确认需求属于哪个语义层级。
2. 若现有 variant 能表达，业务页面直接使用，不增加视觉 class。
3. 若多个页面都需要新模式，在 `components/ui` 或 Design System 中增加语义 variant。
4. 运行 `pnpm design:check`，再运行前端类型检查和构建。
5. 至少在五套随机主题中检查一次主按钮、面板、输入框、下拉菜单和弹窗。

## 代码入口

- Token 与 Tailwind 映射：`apps/desktop/src/styles/design-system.css`
- shadcn 基础组件：`apps/desktop/src/components/ui`
- 自动约束：`scripts/check-design-system.mjs`
