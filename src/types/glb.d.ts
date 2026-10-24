// Copied glTF-binary assets are consumed as URLs through `asset/resource`
// (next.config.ts), so importing one yields its hashed static path.
declare module "*.glb" {
  const url: string;
  export default url;
}
