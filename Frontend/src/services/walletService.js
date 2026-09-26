import api from "./api";

// Normalises the backend shape ({ wallet, transactions }) into something the UI
// can render directly, and never throws for a user who has no wallet row yet.
const mapWallet = (data) => ({
  id: data?.wallet?._id || null,
  balance: Number(data?.wallet?.balance ?? 0),
  transactions: (data?.transactions || []).map((t) => ({
    id: t._id,
    type: t.type,
    amount: Number(t.amount ?? 0),
    description: t.description,
    referenceType: t.referenceType,
    createdAt: t.createdAt,
  })),
});

export const walletService = {
  async getWallet() {
    const response = await api.get("/wallet/user");
    return mapWallet(response.data.data);
  },

  async addFunds(amount, description) {
    const response = await api.post("/wallet/user/add-funds", {
      amount: Number(amount),
      ...(description ? { description } : {}),
    });
    return mapWallet({ wallet: response.data.data?.wallet, transactions: [] });
  },
};
