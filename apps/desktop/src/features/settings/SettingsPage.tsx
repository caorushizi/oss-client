import { FolderOpen, FolderSearch } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export type ClassicSettings = {
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  downloadDir: string;
  transferDoneTip: boolean;
  markdown: boolean;
  showFloatWindow: boolean;
  floatWindowStyle: "circle" | "oval";
  uploadRename: boolean;
};

type SettingsPageProps = {
  settings: ClassicSettings;
  setSettings: Dispatch<SetStateAction<ClassicSettings>>;
  selectDownloadDirectory: () => Promise<void>;
  openDownloadDirectory: () => Promise<void>;
  floatWindowError?: string;
};

export function SettingsPage({
  settings,
  setSettings,
  selectDownloadDirectory,
  openDownloadDirectory,
  floatWindowError,
}: SettingsPageProps) {
  const update = <Key extends keyof ClassicSettings>(
    key: Key,
    value: ClassicSettings[Key],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <section className="h-full overflow-auto px-6 py-5 text-foreground">
      <div className="w-full max-w-3xl space-y-7">
        <SettingsSection title="全局设置">
          <SwitchRow
            label="使用 HTTPS"
            description="生成公开链接时优先使用 HTTPS。"
            checked={settings.useHttps}
            onCheckedChange={(checked) => update("useHttps", checked)}
          />
          <SwitchRow
            label="删除前确认"
            description="执行危险操作前显示确认提示。"
            checked={settings.deleteShowDialog}
            onCheckedChange={(checked) => update("deleteShowDialog", checked)}
          />
          <SwitchRow
            label="覆盖同名文件"
            description="上传目标已存在时直接覆盖。"
            checked={settings.uploadOverwrite}
            onCheckedChange={(checked) => update("uploadOverwrite", checked)}
          />
          <Field orientation="responsive" className="py-3">
            <FieldContent>
              <FieldLabel className="font-medium text-foreground/90">
                默认下载位置
              </FieldLabel>
              <FieldDescription className="text-foreground/65">
                下载文件时默认保存到这个目录。
              </FieldDescription>
            </FieldContent>
            <div className="flex w-full max-w-md items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void selectDownloadDirectory()}
              >
                <FolderSearch data-icon="inline-start" />
                选择
              </Button>
              <InputGroup className="h-7 min-w-0 flex-1 bg-black/20">
                <InputGroupInput
                  className="text-foreground/85 placeholder:text-foreground/45"
                  readOnly
                  aria-label="默认下载位置"
                  placeholder="请选择默认下载位置"
                  value={settings.downloadDir}
                />
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label="打开下载位置"
                  title="打开下载位置"
                  disabled={!settings.downloadDir}
                  onClick={() => void openDownloadDirectory()}
                >
                  <FolderOpen />
                </InputGroupButton>
              </InputGroup>
            </div>
          </Field>
        </SettingsSection>

        <SettingsSection title="托盘与通知">
          <SwitchRow
            label="传输完成提示音"
            description="上传或下载结束后播放提示音。"
            checked={settings.transferDoneTip}
            onCheckedChange={(checked) => update("transferDoneTip", checked)}
          />
          <SwitchRow
            label="复制 Markdown"
            description="复制文件地址时使用 Markdown 图片格式。"
            checked={settings.markdown}
            onCheckedChange={(checked) => update("markdown", checked)}
          />
        </SettingsSection>

        <SettingsSection title="悬浮窗">
          {floatWindowError ? (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{floatWindowError}</AlertDescription>
            </Alert>
          ) : null}
          <SwitchRow
            label="显示悬浮窗"
            description="显示支持拖拽上传的桌面悬浮窗。"
            checked={settings.showFloatWindow}
            onCheckedChange={(checked) => update("showFloatWindow", checked)}
          />
          <Field orientation="responsive" className="py-3">
            <FieldContent>
              <FieldLabel className="font-medium text-foreground/90">
                悬浮窗样式
              </FieldLabel>
              <FieldDescription className="text-foreground/65">
                选择圆形或紧凑的椭圆形外观。
              </FieldDescription>
            </FieldContent>
            <RadioGroup
              className="flex w-full max-w-md items-center gap-5"
              value={settings.floatWindowStyle}
              onValueChange={(value) =>
                update("floatWindowStyle", value as "circle" | "oval")
              }
            >
              <Label className="flex items-center gap-2 font-normal text-foreground/85">
                <RadioGroupItem value="circle" />
                圆形
              </Label>
              <Label className="flex items-center gap-2 font-normal text-foreground/85">
                <RadioGroupItem value="oval" />
                椭圆形
              </Label>
            </RadioGroup>
          </Field>
          <SwitchRow
            label="上传时重命名"
            description="通过悬浮窗上传时生成新的文件名。"
            checked={settings.uploadRename}
            onCheckedChange={(checked) => update("uploadRename", checked)}
          />
        </SettingsSection>
      </div>
    </section>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <FieldSet className="gap-0">
      <FieldLegend className="mb-2 text-sm font-medium text-foreground/80">
        {title}
      </FieldLegend>
      <FieldGroup className="gap-0 rounded-lg border border-white/15 bg-[#343548]/94 px-5 shadow-sm backdrop-blur-md">
        {children}
      </FieldGroup>
    </FieldSet>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <>
      <Field orientation="horizontal" className="py-3">
        <FieldContent>
          <FieldLabel className="font-medium text-foreground/90">
            {label}
          </FieldLabel>
          <FieldDescription className="text-foreground/65">
            {description}
          </FieldDescription>
        </FieldContent>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
        />
      </Field>
      <Separator className="bg-white/12 last:hidden" />
    </>
  );
}
