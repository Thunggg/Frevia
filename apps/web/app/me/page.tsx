import { cookies } from "next/headers";

const getMe = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  return (
    <div>
      <h1>{accessToken?.value}</h1>
    </div>
  );
};

export default getMe;
