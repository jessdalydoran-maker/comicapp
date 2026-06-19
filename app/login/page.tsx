import { Suspense } from "react";

import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="comic-create flex min-h-screen items-center justify-center">
          <p className="font-bangers text-comic-yellow">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
