export function participantProfilePath(user) {
  return user.role === "farmer"
    ? `/farmers/${user.id}`
    : `/users/${user.id}`;
}
