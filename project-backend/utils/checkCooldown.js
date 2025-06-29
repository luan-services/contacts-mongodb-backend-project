export const checkCooldown = (now, lastRequestSentAt, cooldownMinutes) => {
  if (lastRequestSentAt) {
    const diffInMs = now - lastRequestSentAt.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    if (diffInMinutes < cooldownMinutes) {
      const wait = Math.ceil(cooldownMinutes - diffInMinutes);
      return wait
    } else {
        return false
    }
  }
};