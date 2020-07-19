declare module "base-58" {
  function encode(data: Buffer | Uint8Array): string;
  function decode(data: string): Buffer;
}
