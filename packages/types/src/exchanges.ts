export type ExchangeStatus = "PENDING" | "ACCEPTED" | "REFUSED";

export interface TaskExchange {
  id: string;
  scheduleItemId: string;
  fromMemberId: string;
  toMemberId: string;
  status: ExchangeStatus;
  createdAt: string;
  updatedAt: string;
  scheduleItem: {
    date: string;
    task: { name: string; icon?: string; points: number };
  };
}

export interface ProposeExchangeRequest {
  scheduleItemId: string;
  fromMemberId: string;
  toMemberId: string;
}

export interface RespondExchangeRequest {
  status: "ACCEPTED" | "REFUSED";
}
