import { requireAdminPage } from "@/server/auth";
import { SettingsForm } from "@/components/admin/forms";
import { getSettings } from "@/server/settings";
import { settingsSchema } from "@/modules/admin/schemas";
export default async function SettingsPage() {
  await requireAdminPage();
  return (
    <>
      <h1 className="serif mb-8 text-4xl">Настройки магазина</h1>
      <p className="notice mb-6">
        Указывайте только проверенные сведения продавца. Ключи и токены в эти
        поля вводить нельзя. Онлайн-оплата и отправления на этом этапе не
        подключаются.
      </p>
      <SettingsForm initial={settingsSchema.parse(await getSettings())} />
    </>
  );
}
