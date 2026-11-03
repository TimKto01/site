"use client";
import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
} from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
function useNavigation() {
  const router = useRouter();
  return (path: string) => {
    router.push(path);
    router.refresh();
  };
}
import { Button } from "@/components/ui/button";
import {
  categorySchema,
  emptyProduct,
  emptyVariant,
  loginSchema,
  productSchema,
  settingsSchema,
  type CategoryInput,
  type ProductInput,
  type SettingsInput,
} from "@/modules/admin/schemas";
const subscribeReady = () => () => {};
function AdminForm({ children, ...props }: ComponentProps<"form">) {
  const ready = useSyncExternalStore(
    subscribeReady,
    () => true,
    () => false,
  );
  return (
    <form {...props} aria-busy={!ready}>
      <fieldset disabled={!ready} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
async function send(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const result = (await response.json()) as { error?: string; id?: string };
  if (!response.ok)
    throw new Error(result.error ?? "Не удалось сохранить данные");
  return result;
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ошибка соединения. Повторите действие.";
}
function firstError(errors: FieldErrors): string {
  for (const [key, value] of Object.entries(errors)) {
    if (key === "ref" || !value) continue;
    if (typeof value.message === "string") return value.message;
    if (typeof value === "object") {
      const nested = firstError(value as FieldErrors);
      if (nested) return nested;
    }
  }
  return "";
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children}
    </div>
  );
}
function Feedback({ error, success }: { error: string; success?: string }) {
  return (
    <>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function LogoutButton() {
  const navigate = useNavigation();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="text-xs underline"
        onClick={async () => {
          try {
            await send("/api/admin/logout", "POST");
            navigate("/admin/login");
          } catch (e) {
            setError(message(e));
          }
        }}
      >
        Выйти
      </button>
      {error && (
        <p role="alert" className="text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
export function LoginForm() {
  const navigate = useNavigation();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <AdminForm
      className="admin-form"
      onSubmit={handleSubmit(async (data) => {
        setError("");
        try {
          await send("/api/admin/login", "POST", data);
          navigate("/admin");
        } catch (e) {
          setError(message(e));
        }
      })}
    >
      <Field label="Логин">
        <input
          autoComplete="username"
          className="field"
          {...register("username")}
        />
      </Field>
      <Field label="Пароль">
        <input
          type="password"
          autoComplete="current-password"
          className="field"
          {...register("password")}
        />
      </Field>
      <Feedback error={error || firstError(errors)} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Проверяем…" : "Войти"}
      </Button>
    </AdminForm>
  );
}
function Upload({
  onUploaded,
  disabled = false,
}: {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <label className="admin-field">
        <span>Загрузить фотографию (JPEG, PNG, WebP, до 5 МБ)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || disabled}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setError("");
            setBusy(true);
            try {
              const form = new FormData();
              form.set("file", file);
              const response = await fetch("/api/admin/uploads", {
                method: "POST",
                body: form,
              });
              const data = (await response.json()) as {
                url?: string;
                error?: string;
              };
              if (!response.ok || !data.url)
                throw new Error(data.error ?? "Загрузка не удалась");
              onUploaded(data.url);
            } catch (e) {
              setError(message(e));
            } finally {
              input.value = "";
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && (
        <p role="status" className="text-xs">
          Проверяем и сохраняем изображение…
        </p>
      )}
      <Feedback error={error} />
    </div>
  );
}
export function ProductForm({
  id,
  initial,
  categories,
  saved = false,
}: {
  id?: string;
  initial?: ProductInput;
  categories: { id: string; name: string }[];
  saved?: boolean;
}) {
  const [success, setSuccess] = useState(saved);
  const navigate = useNavigation();
  const [error, setError] = useState("");
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    values: initial,
    defaultValues: initial ?? {
      ...emptyProduct,
      categoryId: categories[0]?.id ?? "",
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const variants = useFieldArray({
    control,
    name: "variants",
    keyName: "formKey",
  });
  const images = useFieldArray({ control, name: "images", keyName: "formKey" });
  const attributes = useFieldArray({
    control,
    name: "attributes",
    keyName: "formKey",
  });
  const image = images.fields[0]?.url;
  return (
    <AdminForm
      className="admin-form"
      onChange={() => setSuccess(false)}
      onSubmit={handleSubmit(async (data) => {
        setError("");
        setSuccess(false);
        try {
          const result = await send(
            id ? `/api/admin/products/${id}` : "/api/admin/products",
            id ? "PUT" : "POST",
            data,
          );
          setSuccess(true);
          navigate(`/admin/products/${result.id}?saved=1`);
        } catch (e) {
          setError(message(e));
        }
      })}
      noValidate
    >
      <section className="admin-panel">
        <h2>Основная информация</h2>
        <div className="admin-grid">
          <Field label="Название товара">
            <input className="field" {...register("name")} />
          </Field>
          <Field label="Адрес товара (латиницей)">
            <input className="field" {...register("slug")} />
          </Field>
          <Field label="Артикул">
            <input className="field" {...register("sku")} />
          </Field>
          <Field label="Латинское название">
            <input className="field" {...register("latin")} />
          </Field>
          <Field label="Категория">
            <select className="field" {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Статус публикации">
            <select className="field" {...register("status")}>
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликован</option>
              <option value="ARCHIVED">Архив</option>
            </select>
          </Field>
        </div>
        <Field label="Краткое описание">
          <textarea
            className="field"
            rows={2}
            {...register("shortDescription")}
          />
        </Field>
        <Field label="Описание">
          <textarea className="field" rows={6} {...register("description")} />
        </Field>
        <div className="flex flex-wrap gap-5">
          <label>
            <input type="checkbox" {...register("isDemo")} /> Демонстрационный
            товар
          </label>
          <label>
            <input type="checkbox" {...register("isNew")} /> Новинка
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>Изображения</h2>
        <p className="text-sm text-secondary">
          Первое изображение — обложка. Не более 8 изображений. Переместить
          фотографию в начало можно кнопкой «Обложка».
        </p>
        <Upload
          disabled={images.fields.length >= 8}
          onUploaded={(url) => images.append({ url, alt: "" })}
        />
        <div className="grid gap-4">
          {images.fields.map((item, index) => (
            <div key={item.formKey} className="admin-image-row">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline"
              >
                {index === 0 ? "Обложка" : `Изображение ${index + 1}`}
              </a>
              <Field label={`Описание изображения ${index + 1}`}>
                <input className="field" {...register(`images.${index}.alt`)} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => images.move(index, 0)}
                >
                  Обложка
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => images.remove(index)}
                >
                  Удалить изображение
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={images.fields.length >= 8}
          onClick={() =>
            images.append({
              url: "/illustrations/shrub.svg",
              alt: "Нейтральная иллюстрация",
            })
          }
        >
          Добавить иллюстрацию
        </Button>
        {image && (
          <p className="text-xs text-secondary">
            Изображения сохранятся вместе с товаром.
          </p>
        )}
      </section>
      <section className="admin-panel">
        <h2>Варианты размера и остатки</h2>
        {variants.fields.map((item, index) => (
          <fieldset key={item.formKey} className="admin-variant">
            <legend>Вариант {index + 1}</legend>
            <div className="admin-grid">
              <Field label={`Размер ${index + 1}`}>
                <input
                  className="field"
                  {...register(`variants.${index}.label`)}
                />
              </Field>
              <Field label={`Цена ${index + 1}, ₽`}>
                <input
                  inputMode="decimal"
                  className="field"
                  {...register(`variants.${index}.priceRubles`)}
                />
              </Field>
              <Field label={`Остаток ${index + 1}, шт.`}>
                <input
                  type="number"
                  min={0}
                  className="field"
                  {...register(`variants.${index}.stock`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field label={`Контейнер ${index + 1}`}>
                <input
                  className="field"
                  {...register(`variants.${index}.container`)}
                />
              </Field>
              <Field label={`Вес ${index + 1}, г`}>
                <input
                  type="number"
                  min={0}
                  className="field"
                  {...register(`variants.${index}.weightGrams`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field label={`Длина упаковки ${index + 1}, мм`}>
                <input
                  type="number"
                  min={0}
                  className="field"
                  {...register(`variants.${index}.lengthMm`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field label={`Ширина упаковки ${index + 1}, мм`}>
                <input
                  type="number"
                  min={0}
                  className="field"
                  {...register(`variants.${index}.widthMm`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field label={`Высота упаковки ${index + 1}, мм`}>
                <input
                  type="number"
                  min={0}
                  className="field"
                  {...register(`variants.${index}.heightMm`, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={variants.fields.length === 1}
              onClick={() => variants.remove(index)}
            >
              Убрать вариант {index + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={variants.fields.length >= 30}
          onClick={() => variants.append({ ...emptyVariant })}
        >
          Добавить вариант
        </Button>
      </section>
      <section className="admin-panel">
        <h2>Характеристики и доставка</h2>
        {attributes.fields.map((item, index) => (
          <div key={item.formKey} className="admin-grid">
            <Field label={`Характеристика ${index + 1}`}>
              <input
                className="field"
                {...register(`attributes.${index}.name`)}
              />
            </Field>
            <Field label={`Значение ${index + 1}`}>
              <input
                className="field"
                {...register(`attributes.${index}.value`)}
              />
            </Field>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => attributes.remove(index)}
            >
              Удалить характеристику {index + 1}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={attributes.fields.length >= 40}
          onClick={() => attributes.append({ name: "", value: "" })}
        >
          Добавить характеристику
        </Button>
        <label className="mt-5 block">
          <input type="checkbox" {...register("shippingAllowed")} /> Перевозка в
          принципе разрешена (правила перевозчика проверяются отдельно)
        </label>
        <Field label="Ограничения и сезонность доставки">
          <textarea className="field" rows={3} {...register("shippingNote")} />
        </Field>
      </section>
      <Feedback
        error={error || firstError(errors)}
        success={success ? "Товар сохранён в базе данных." : ""}
      />
      <div className="flex flex-wrap gap-4">
        <Button type="submit" disabled={isSubmitting || !categories.length}>
          {isSubmitting ? "Сохраняем…" : "Сохранить товар"}
        </Button>
        {id && (
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (
                !confirm(
                  "Архивировать товар? Он исчезнет из витрины, данные сохранятся.",
                )
              )
                return;
              try {
                await send(`/api/admin/products/${id}`, "DELETE");
                navigate("/admin/products");
              } catch (e) {
                setError(message(e));
              }
            }}
          >
            Архивировать товар
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/admin/products">К списку</Link>
        </Button>
      </div>
    </AdminForm>
  );
}
export function CategoryForm({
  id,
  initial,
}: {
  id?: string;
  initial?: CategoryInput;
}) {
  const navigate = useNavigation();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    values: initial,
    defaultValues: initial ?? {
      name: "",
      slug: "",
      caption: "",
      image: "/illustrations/shrub.svg",
      sortOrder: 0,
    },
  });
  return (
    <AdminForm
      className="admin-form"
      data-testid="category-form"
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("");
          await send(
            id ? `/api/admin/categories/${id}` : "/api/admin/categories",
            id ? "PUT" : "POST",
            data,
          );
          navigate("/admin/categories?saved=1");
        } catch (e) {
          setError(message(e));
        }
      })}
    >
      <div className="admin-grid">
        <Field label="Название категории">
          <input className="field" {...register("name")} />
        </Field>
        <Field label="Адрес категории">
          <input className="field" {...register("slug")} />
        </Field>
        <Field label="Подпись">
          <input className="field" {...register("caption")} />
        </Field>
        <Field label="Порядок">
          <input
            type="number"
            min={0}
            className="field"
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Иллюстрация категории">
          <select className="field" {...register("image")}>
            {[
              ["thuja", "Туя"],
              ["juniper", "Можжевельник"],
              ["spruce", "Ель"],
              ["pine", "Сосна"],
              ["shrub", "Кустарник"],
              ["flower", "Цветы"],
            ].map(([kind, title]) => (
              <option key={kind} value={`/illustrations/${kind}.svg`}>
                {title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Feedback error={error || firstError(errors)} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {id ? "Сохранить категорию" : "Создать категорию"}
        </Button>
        {id && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!confirm("Удалить пустую категорию?")) return;
              try {
                setError("");
                await send(`/api/admin/categories/${id}`, "DELETE");
                navigate("/admin/categories");
              } catch (e) {
                setError(message(e));
              }
            }}
          >
            Удалить категорию
          </Button>
        )}
      </div>
    </AdminForm>
  );
}
export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });
  const logo = useWatch({ control, name: "logo" });
  return (
    <AdminForm
      className="admin-form"
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("");
          setSuccess("");
          await send("/api/admin/settings", "PUT", data);
          setSuccess(
            "Настройки сохранены. Изменения видны на витрине после обновления страницы.",
          );
        } catch (e) {
          setError(message(e));
        }
      })}
    >
      <section className="admin-panel">
        <h2>Магазин и контакты</h2>
        <div className="admin-grid">
          <Field label="Название магазина">
            <input className="field" {...register("name")} />
          </Field>
          <Field label="Телефон">
            <input className="field" {...register("phone")} />
          </Field>
          <Field label="Электронная почта">
            <input type="email" className="field" {...register("email")} />
          </Field>
          <Field label="Адрес">
            <input className="field" {...register("address")} />
          </Field>
          <Field label="Часы работы">
            <input className="field" {...register("hours")} />
          </Field>
          <Field label="Предупреждать об остатке не выше">
            <input
              className="field"
              type="number"
              min={0}
              {...register("lowStockThreshold", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <h3>Логотип</h3>
        <Upload
          onUploaded={(url) => setValue("logo", url, { shouldDirty: true })}
        />
        {logo && (
          <div className="flex gap-4">
            <a
              href={logo}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              Посмотреть логотип
            </a>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => setValue("logo", "")}
            >
              Убрать логотип
            </button>
          </div>
        )}
      </section>
      <section className="admin-panel">
        <h2>Тексты главной страницы</h2>
        <Field label="Заголовок главной">
          <textarea className="field" rows={2} {...register("heroTitle")} />
        </Field>
        <Field label="Описание главной">
          <textarea
            className="field"
            rows={4}
            {...register("heroDescription")}
          />
        </Field>
        <Field label="Заголовок о магазине">
          <textarea className="field" rows={2} {...register("storyTitle")} />
        </Field>
        <Field label="Текст о магазине">
          <textarea className="field" rows={5} {...register("storyText")} />
        </Field>
      </section>
      <Feedback error={error || firstError(errors)} success={success} />
      <Button type="submit" disabled={isSubmitting}>
        Сохранить настройки
      </Button>
    </AdminForm>
  );
}
