import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { motivo } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Pulso Comercial</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Inicia sesión para continuar.
        </p>
      </div>

      {motivo === "inactivo" ? (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu sesión ha finalizado porque la cuenta está desactivada.
        </p>
      ) : null}

      <LoginForm />
    </main>
  );
}
