const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

export const getQueues = async () => {
  const res = await fetch(`${BASE_URL}/queues`);
  return res.json();
};

export const createQueue = async (name) => {
  const res = await fetch(`${BASE_URL}/queues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  return res.json();
};

export const callQueue = async (id, loket) => {
  const res = await fetch(`${BASE_URL}/queues/${id}/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ loket }),
  });

  return res.json();
};
