export function assert<T>(v: T): NonNullable<T> {
  if (!v) {
    throw TypeError();
  }

  return v;
}
