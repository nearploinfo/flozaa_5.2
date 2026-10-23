import { useAppSelector } from "@/store/hooks";

interface ChatSettingsRaw {
  maxCharactersInATextMessage?: number | string;
  maxFileSizeInMBCanBeSent?: number | string;
  maxFilesOrImagesInOneMessage?: number | string;
  enable_chat_image_upload?: number | string;
  enable_chat_file_upload?: number | string;
  allow_pre_booking_chat?: number | string;
  allow_post_booking_chat?: number | string;
}

/** Reads chat_settings (with general_settings fallbacks) from the settings slice. */
export function useChatSettings() {
  const settings = useAppSelector((state) => state.settings.data) as
    | { chat_settings?: ChatSettingsRaw; general_settings?: ChatSettingsRaw }
    | null;

  const chatSettings = settings?.chat_settings;
  const generalSettings = settings?.general_settings;
  const pick = (key: keyof ChatSettingsRaw) => chatSettings?.[key] ?? generalSettings?.[key];

  return {
    maxCharacters: Number(pick("maxCharactersInATextMessage") ?? 1000),
    maxFileSizeMB: Number(pick("maxFileSizeInMBCanBeSent") ?? 10),
    maxFilesPerMessage: Number(pick("maxFilesOrImagesInOneMessage") ?? 5),
    isImageUploadEnabled: Number(pick("enable_chat_image_upload") ?? 1) === 1,
    isFileUploadEnabled: Number(pick("enable_chat_file_upload") ?? 1) === 1,
    allowPreBookingChat: Number(chatSettings?.allow_pre_booking_chat ?? 1) === 1,
    allowPostBookingChat: Number(chatSettings?.allow_post_booking_chat ?? 1) === 1,
  };
}
