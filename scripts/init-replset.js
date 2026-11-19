try {
  const s = rs.status();
  print("ALREADY_INITIALIZED");
} catch(e) {
  const r = rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27018" }] });
  print("INIT_OK: " + JSON.stringify(r));
}
