import { Check, Pencil, Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuckets } from "@/features/buckets/use-buckets";
import { useDomains } from "@/features/buckets/use-domains";
import { useProfiles, type Profile } from "@/features/profiles/use-profiles";
import { apiRequest } from "@/lib/backend/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

export function ProfilesPage() {
  const profiles = useProfiles();
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const setActiveProfileId = useAppStore((state) => state.setActiveProfileId);
  const buckets = useBuckets(activeProfileId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string>();
  const [editingUploadBucket, setEditingUploadBucket] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [provider, setProvider] = useState("qiniu");
  const profilesById = useMemo(
    () =>
      new Map((profiles.data ?? []).map((profile) => [profile.id, profile])),
    [profiles.data],
  );
  const editingProfile = editingProfileId
    ? profilesById.get(editingProfileId)
    : undefined;
  const profileDomains = useDomains(editingProfile?.id, editingUploadBucket);
  const profileDomainOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            editingProfile?.defaultDomain,
            ...(profileDomains.data ?? []),
          ].filter((domain): domain is string => Boolean(domain)),
        ),
      ),
    [editingProfile?.defaultDomain, profileDomains.data],
  );

  function openNewProfile() {
    setEditingProfileId(undefined);
    setEditingUploadBucket("");
    setProvider("qiniu");
    setFormError(undefined);
    setDialogOpen(true);
  }

  function openProfileEditor(profile: Profile) {
    setActiveProfileId(profile.id);
    setEditingProfileId(profile.id);
    setEditingUploadBucket(profile.uploadBucket);
    setProvider(profile.provider);
    setFormError(undefined);
    setDialogOpen(true);
  }

  function closeProfileEditor() {
    if (submitting) return;
    setDialogOpen(false);
    setFormError(undefined);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && submitting) return;
    setDialogOpen(open);
    if (!open) setFormError(undefined);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" && value !== "__none__" ? value : "";
    };
    setSubmitting(true);
    setFormError(undefined);

    try {
      const accessKeyId = field("accessKeyId");
      const accessKeySecret = field("accessKeySecret");
      const body: Record<string, unknown> = {
        name: field("name"),
        provider,
        region: field("region"),
        endpoint: field("endpoint"),
        uploadBucket: field("uploadBucket"),
        uploadPrefix: field("uploadPrefix"),
        defaultDomain: field("defaultDomain"),
      };
      if (!editingProfile || accessKeyId || accessKeySecret) {
        body.credentials = { accessKeyId, accessKeySecret };
      }
      const profile = await apiRequest<Profile>(
        editingProfile
          ? "/api/v1/profiles/" + editingProfile.id
          : "/api/v1/profiles",
        {
          method: editingProfile ? "PATCH" : "POST",
          body: JSON.stringify(body),
        },
      );
      await profiles.mutate();
      setActiveProfileId(profile.id);
      setDialogOpen(false);
      setEditingProfileId(undefined);
      setEditingUploadBucket("");
      setProvider("qiniu");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEditingProfile() {
    if (!editingProfile) return;
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/profiles/" + editingProfile.id, {
        method: "DELETE",
      });
      const nextProfile = profiles.data?.find(
        (profile) => profile.id !== editingProfile.id,
      );
      setActiveProfileId(nextProfile?.id);
      setDialogOpen(false);
      setEditingProfileId(undefined);
      setEditingUploadBucket("");
      await profiles.mutate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="h-full overflow-auto px-6 py-6 text-foreground">
      <header className="mb-5">
        <h1 className="text-xl font-medium">存储配置</h1>
        <p className="mt-1 text-sm text-text-muted">
          管理云存储账号；点击卡片即可修改配置。
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        <Card className="min-h-48 border-dashed border-border-strong bg-surface-subtle py-0 shadow-none transition-colors hover:border-text-muted hover:bg-surface-panel-hover">
          <Button
            type="button"
            variant="ghost"
            className="min-h-48 w-full flex-col gap-3 rounded-xl text-text-secondary hover:bg-transparent hover:text-text-primary"
            onClick={openNewProfile}
          >
            <span className="flex size-11 items-center justify-center rounded-full border border-border-default bg-control-secondary">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-medium">新增配置</span>
            <span className="text-xs font-normal text-text-muted">
              添加云存储或 S3 兼容服务
            </span>
          </Button>
        </Card>

        {profiles.error ? (
          <Card className="min-h-48 justify-center border border-destructive/25 bg-destructive/8 px-5 text-destructive ring-0">
            <p className="font-medium">配置读取失败</p>
            <p className="text-sm opacity-75">
              {profiles.error instanceof Error
                ? profiles.error.message
                : "无法获取存储配置"}
            </p>
          </Card>
        ) : null}

        {profiles.data?.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <Card
              key={profile.id}
              className={cn(
                "min-h-48 py-0 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-panel-hover hover:shadow-elevated",
                isActive &&
                  "border-border-strong bg-surface-selected ring-1 ring-border-subtle",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                className="min-h-48 w-full flex-col items-stretch justify-start gap-4 rounded-xl p-4 text-left whitespace-normal hover:bg-control-ghost-hover"
                onClick={() => openProfileEditor(profile)}
              >
                <span className="flex w-full items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-input">
                    <ProviderIcon provider={profile.provider} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-foreground">
                      {profile.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-text-muted">
                      {providerName(profile.provider)}
                    </span>
                  </span>
                  {isActive ? (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <Check className="size-3" />
                      当前
                    </Badge>
                  ) : null}
                </span>

                <span className="grid w-full gap-2 text-xs font-normal">
                  <ProfileCardRow
                    label={profile.endpoint ? "Endpoint" : "Region"}
                    value={
                      profile.endpoint || profile.region || "使用服务商默认配置"
                    }
                  />
                  <ProfileCardRow
                    label="Bucket"
                    value={profile.uploadBucket || "未设置"}
                  />
                  <ProfileCardRow
                    label="默认域名"
                    value={profile.defaultDomain || "未设置"}
                  />
                </span>

                <span className="mt-auto flex w-full items-center justify-end gap-1 text-xs font-normal text-text-muted group-hover/button:text-text-secondary">
                  <Pencil className="size-3" />
                  点击修改配置
                </span>
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "修改存储配置" : "新增存储配置"}
            </DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "更新账号凭据及默认上传配置。留空 AK、SK 将保留原凭据。"
                : "添加新的云存储或 S3 兼容服务。"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 pb-2">
            <form
              id="profile-editor-form"
              key={editingProfile?.id ?? "new-profile"}
              onSubmit={saveProfile}
            >
              <FieldGroup className="gap-4">
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-name">名称</FieldLabel>
                  <FieldContent>
                    <Input
                      id="profile-name"
                      name="name"
                      placeholder="生产环境"
                      defaultValue={editingProfile?.name}
                      required
                    />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-provider">类型</FieldLabel>
                  <FieldContent>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger id="profile-provider" className="w-full">
                        <SelectValue placeholder="选择存储类型" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="qiniu">七牛云</SelectItem>
                        <SelectItem value="aliyun">阿里云 OSS</SelectItem>
                        <SelectItem value="tencent">腾讯云 COS</SelectItem>
                        <SelectItem value="rustfs">RustFS</SelectItem>
                        <SelectItem value="s3">S3 兼容存储</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                {isS3CompatibleProvider(provider) ? (
                  <Field orientation="responsive">
                    <FieldLabel htmlFor="profile-endpoint">Endpoint</FieldLabel>
                    <FieldContent>
                      <Input
                        id="profile-endpoint"
                        key={provider + "-endpoint"}
                        name="endpoint"
                        placeholder="例如 http://localhost:9000"
                        type="url"
                        autoComplete="off"
                        defaultValue={editingProfile?.endpoint}
                        required
                      />
                    </FieldContent>
                  </Field>
                ) : null}
                {provider !== "qiniu" ? (
                  <Field orientation="responsive">
                    <FieldLabel htmlFor="profile-region">Region</FieldLabel>
                    <FieldContent>
                      <Input
                        id="profile-region"
                        key={provider + "-region"}
                        name="region"
                        placeholder={
                          provider === "aliyun"
                            ? "例如 cn-hangzhou"
                            : provider === "tencent"
                              ? "例如 ap-guangzhou"
                              : "例如 us-east-1"
                        }
                        defaultValue={
                          editingProfile?.region ||
                          (isS3CompatibleProvider(provider)
                            ? "us-east-1"
                            : undefined)
                        }
                        autoComplete="off"
                        required
                      />
                    </FieldContent>
                  </Field>
                ) : null}
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-ak">AK</FieldLabel>
                  <FieldContent>
                    <Input
                      id="profile-ak"
                      name="accessKeyId"
                      autoComplete="off"
                      placeholder={editingProfile?.accessKeyHint}
                      required={!editingProfile}
                    />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-sk">SK</FieldLabel>
                  <FieldContent>
                    <Input
                      id="profile-sk"
                      name="accessKeySecret"
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        editingProfile ? "留空则保持不变" : undefined
                      }
                      required={!editingProfile}
                    />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-bucket">默认 Bucket</FieldLabel>
                  <FieldContent>
                    {editingProfile && buckets.data?.length ? (
                      <Select
                        name="uploadBucket"
                        value={editingUploadBucket || "__none__"}
                        onValueChange={(value) =>
                          setEditingUploadBucket(
                            value === "__none__" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger id="profile-bucket" className="w-full">
                          <SelectValue placeholder="不设置" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="__none__">不设置</SelectItem>
                          {buckets.data.map((bucket) => (
                            <SelectItem key={bucket.name} value={bucket.name}>
                              {bucket.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="profile-bucket"
                        name="uploadBucket"
                        defaultValue={editingProfile?.uploadBucket}
                        placeholder="可选"
                        autoComplete="off"
                      />
                    )}
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-prefix">默认上传前缀</FieldLabel>
                  <FieldContent>
                    <Input
                      id="profile-prefix"
                      name="uploadPrefix"
                      defaultValue={editingProfile?.uploadPrefix}
                      placeholder="例如 images/"
                      autoComplete="off"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="profile-domain">默认域名</FieldLabel>
                  <FieldContent>
                    {profileDomainOptions.length ? (
                      <Select
                        name="defaultDomain"
                        defaultValue={
                          editingProfile?.defaultDomain || "__none__"
                        }
                      >
                        <SelectTrigger id="profile-domain" className="w-full">
                          <SelectValue placeholder="不设置" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="__none__">不设置</SelectItem>
                          {profileDomainOptions.map((domain) => (
                            <SelectItem key={domain} value={domain}>
                              {domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="profile-domain"
                        name="defaultDomain"
                        defaultValue={editingProfile?.defaultDomain}
                        placeholder="例如 https://cdn.example.com"
                        autoComplete="off"
                      />
                    )}
                  </FieldContent>
                </Field>
                {formError ? <FieldError>{formError}</FieldError> : null}
              </FieldGroup>
            </form>
          </div>

          <DialogFooter>
            <div>
              {editingProfile ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={submitting}
                    >
                      删除配置
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>删除应用配置？</AlertDialogTitle>
                      <AlertDialogDescription>
                        将删除“{editingProfile.name}
                        ”及其本地凭据配置。云端文件不会被删除。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => void deleteEditingProfile()}
                      >
                        确认删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={submitting}
                onClick={closeProfileEditor}
              >
                取消
              </Button>
              <Button
                type="submit"
                form="profile-editor-form"
                size="sm"
                disabled={submitting}
              >
                {submitting
                  ? "保存中…"
                  : editingProfile
                    ? "保存修改"
                    : "新增配置"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProfileCardRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="grid w-full grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
      <span className="text-text-muted">{label}</span>
      <span className="truncate text-text-secondary" title={value}>
        {value}
      </span>
    </span>
  );
}
function ProviderIcon({ provider }: { provider: string }) {
  if (isS3CompatibleProvider(provider)) {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#f07b4f"
          d="M12 3c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3Zm-8 6.1C5.72 10.3 8.73 11 12 11s6.28-.7 8-1.9V13c0 1.66-3.58 3-8 3s-8-1.34-8-3V9.1Zm0 7C5.72 17.3 8.73 18 12 18s6.28-.7 8-1.9V18c0 1.66-3.58 3-8 3s-8-1.34-8-3v-1.9Z"
        />
      </svg>
    );
  }

  if (provider === "aliyun") {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#ff6a00"
          d="M14.752 4.64h5.274C22.242 4.64 24 6.475 24 8.691V15.8a3.947 3.947 0 0 1-3.974 3.975h-5.274l1.299-1.835 3.822-1.222c.688-.23 1.146-.918 1.146-1.605v-5.81c0-.687-.458-1.375-1.146-1.605L16.05 6.475l-1.3-1.835ZM2.98 15.111c0 .688.46 1.376 1.147 1.606l3.822 1.146 1.3 1.835H3.974A3.947 3.947 0 0 1 0 15.723V8.69c0-2.216 1.758-4.05 3.975-4.05h5.273L7.95 6.474 4.127 7.697c-.688.23-1.146.918-1.146 1.606v5.808Zm13.071-3.898H8.025v1.835h8.026v-1.835Z"
        />
      </svg>
    );
  }

  if (provider === "tencent") {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#00a3ff"
          d="M20.048 17.142c-.354.35-1.061.874-2.3.874h-7.605l4.422-4.198c.177-.175.62-.612 1.061-.962.885-.787 1.592-.874 2.211-.874.885 0 1.592.35 2.211.874 1.238 1.137 1.238 3.149 0 4.286Zm1.504-5.685c-.885-.962-2.211-1.574-3.626-1.574-1.239 0-2.3.437-3.273 1.137-.353.35-.884.7-1.326 1.224-.354.35-7.96 7.696-7.96 7.696.442.088.973.088 1.415.088h9.64c.708 0 1.238 0 1.769-.088 1.15-.087 2.3-.524 3.272-1.399 2.035-1.924 2.035-5.16.089-7.084Z"
        />
        <path
          fill="#00c8dc"
          d="M9.17 10.932c-.973-.7-1.946-1.05-3.095-1.05-1.415 0-2.742.613-3.626 1.575-1.946 2.011-1.946 5.16.088 7.171.884.787 1.769 1.224 2.83 1.312l2.034-1.924c-.353 0-.796 0-1.15-.088-1.149 0-1.856-.35-2.299-.786-1.238-1.225-1.238-3.149-.088-4.373.619-.612 1.327-.875 2.211-.875.53 0 1.327.088 2.122.875.354.35 1.327 1.05 1.68 1.399h.089l1.327-1.312v-.087c-.62-.612-1.592-1.4-2.123-1.837Z"
        />
        <path
          fill="#006eff"
          d="M18.456 8.745C17.484 6.122 14.919 4.285 12 4.285c-3.449 0-6.19 2.536-6.721 5.685.265 0 .53-.088.884-.088s.796.088 1.15.088C7.755 7.783 9.701 6.21 12 6.21c1.946 0 3.626 1.137 4.422 2.799 0 0 .089.087.089 0 .619-.088 1.326-.263 1.945-.263Z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="legacy-provider-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#06aeef"
        d="M23.111 4.6a.914.914 0 0 0-.861.161A13.443 13.443 0 0 1 7.947 8.897L7.38 6.831a1.076 1.076 0 0 0-1.211-.698l.27 2.18c-1.816-.827-2.313-.946-3.587-2.45C2.674 5.729 1.263 4.472.89 4.6a11.906 11.906 0 0 0 5.892 6.497l.738 5.97s.33 2.286 2.473 2.286h4.586c2.144 0 2.474-2.286 2.474-2.286l.518-4.28c-1.393-.11-2.268.857-2.546 1.814-.465 1.614-.465 1.716-.557 1.998-.188.575-.806.644-.806.644h-2.753s-.617-.07-.806-.644c-.12-.371-.727-2.54-1.335-4.74A11.877 11.877 0 0 0 23.11 4.599Z"
      />
    </svg>
  );
}

function providerName(provider: string) {
  const names: Record<string, string> = {
    qiniu: "七牛云",
    aliyun: "阿里云 OSS",
    tencent: "腾讯云 COS",
    rustfs: "RustFS",
    s3: "S3 兼容存储",
  };
  return names[provider] ?? provider;
}

function isS3CompatibleProvider(provider: string) {
  return provider === "rustfs" || provider === "s3";
}
