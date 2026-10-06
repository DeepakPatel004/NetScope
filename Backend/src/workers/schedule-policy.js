export function healthIntervalMs(device) {
  const seconds = Number(device.interval);
  return Math.max(5, Number.isFinite(seconds) && seconds > 0 ? seconds : 30) * 1000;
}

export function supportsTls(device) {
  return device.type === 'WEBSITE' || device.type === 'API' || /^https:\/\//i.test(device.host);
}
