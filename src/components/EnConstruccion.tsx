export function EnConstruccion({
  titulo,
  modulo,
}: {
  titulo: string;
  modulo: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="mt-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
        Esta pantalla se construye en el {modulo}.
      </p>
    </div>
  );
}
