import { cookies } from "next/headers";

const getMe = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  const res = await fetch(`http://localhost:3000/api/auth/me`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken?.value}`,
    },
  });

  const data = await res.json();

  return (
    <div>
      <h1>{JSON.stringify(data.data.email)}</h1>
    </div>
  );
};

export default getMe;
