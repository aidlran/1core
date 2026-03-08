export function timestampToString(timestamp?: number) {
  if (timestamp === undefined) {
    return '';
  }

  if (timestamp % 864e5 == 0) {
    return new Date(timestamp).toLocaleDateString();
  }

  return new Date(timestamp).toLocaleString();
}
