export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  reminder: number | null;
}

export interface TaskPayload {
  text: string;
  timestamp: number;
}

export interface ReminderPayload {
  id: string;
  text: string;
  reminderTime: number;
}

export interface VapidKeyResponse {
  publicKey: string;
}

// beforeinstallprompt не включён в стандартные lib.dom типы
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
