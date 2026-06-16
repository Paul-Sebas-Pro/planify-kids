import { AppError, NotFoundError } from "../../core/errors/AppError";
import { getMemberById } from "../members/members.repository";
import {
  getExchangesByFamily,
  getExchangeById,
  getPendingExchangeForItem,
  createExchange,
  updateExchangeStatus,
  reassignScheduleItem,
} from "./exchanges.repository";
import type {
  ProposeExchangeInput,
  RespondExchangeInput,
} from "./exchanges.schema";

export function listExchangesService(
  familyId: string,
  limit: number,
  status?: "PENDING" | "ACCEPTED" | "REFUSED",
) {
  return getExchangesByFamily(familyId, limit, status);
}

export async function proposeExchangeService(
  familyId: string,
  input: ProposeExchangeInput,
) {
  if (input.fromMemberId === input.toMemberId) {
    throw new AppError("Les deux membres doivent être différents", 400);
  }

  const [fromMember, toMember] = await Promise.all([
    getMemberById(input.fromMemberId, familyId),
    getMemberById(input.toMemberId, familyId),
  ]);

  if (!fromMember) throw new NotFoundError("Membre source");
  if (!toMember) throw new NotFoundError("Membre cible");

  const pending = await getPendingExchangeForItem(input.scheduleItemId);
  if (pending) {
    throw new AppError("Un échange est déjà en attente pour cette tâche", 409);
  }

  return createExchange(input);
}

export async function respondExchangeService(
  exchangeId: string,
  familyId: string,
  input: RespondExchangeInput,
) {
  const exchange = await getExchangeById(exchangeId);

  if (!exchange || exchange.scheduleItem.schedule.familyId !== familyId) {
    throw new NotFoundError("Échange");
  }

  if (exchange.status !== "PENDING") {
    throw new AppError("Cet échange a déjà été traité", 400);
  }

  await updateExchangeStatus(exchangeId, input.status);

  if (input.status === "ACCEPTED") {
    await reassignScheduleItem(exchange.scheduleItemId, exchange.toMemberId);
  }

  return { ...exchange, status: input.status };
}
