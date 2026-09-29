"use client";

import { authApiRequest } from "../apiRequests/auth";

const ViewProfile = async () => {
  const res = await authApiRequest.me();

  return (
    <div>
      <h1>{res.success ? "Success" : "Failed"}</h1>
    </div>
  );
};

export default ViewProfile;
