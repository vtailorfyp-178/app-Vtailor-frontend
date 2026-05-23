/** glTF binary / GLB magic: first uint32 little-endian is 0x46546C67 ("glTF"). */
export function isGlbArrayBuffer(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 12) return false;
  const view = new DataView(buf);
  return view.getUint32(0, true) === 0x46546c67;
}
