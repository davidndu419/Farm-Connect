export function sendData(response, data, status = 200, meta) {
  const body = { data };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return response.status(status).json(body);
}
