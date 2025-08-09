// src/lib/xiaoBle.ts
export type AccelSample = {
  ax: number; // g
  ay: number; // g
  az: number; // g
};

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CHAR_UUID    = "12345678-1234-5678-1234-56789abcdef1";

export type ConnectOptions = {
  onData?: (sample: AccelSample, raw: DataView) => void;
  onDisconnect?: (ev?: Event) => void;
  onStatus?: (text: string) => void; // 任意：UI表示用
};

export type XiaoBleController = {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
  disconnect: () => void;
};

export async function connectXiaoBle(opts: ConnectOptions = {}): Promise<XiaoBleController> {
  const { onData, onDisconnect, onStatus } = opts;

  if (!("bluetooth" in navigator)) {
    throw new Error("このブラウザは Web Bluetooth に未対応です。Chrome系を使用してください。");
  }

  onStatus?.("デバイス検索中…");
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
  });

  device.addEventListener("gattserverdisconnected", (ev) => {
    onStatus?.("切断されました。");
    onDisconnect?.(ev);
  });

  onStatus?.("接続中…");
  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const ch = await service.getCharacteristic(CHAR_UUID);

  await ch.startNotifications();
  onStatus?.("受信中（Notify）");

  const handler = (ev: Event) => {
    const dv = (ev.target as BluetoothRemoteGATTCharacteristic).value!;
    if (dv.byteLength < 12) return;

    const ax = dv.getFloat32(0, true);
    const ay = dv.getFloat32(4, true);
    const az = dv.getFloat32(8, true);

    onData?.({ ax, ay, az }, dv);
  };

  ch.addEventListener("characteristicvaluechanged", handler);

  const disconnect = () => {
    try {
      ch.removeEventListener("characteristicvaluechanged", handler);
      device.gatt?.disconnect();
    } catch { /* noop */ }
  };

  return { device, characteristic: ch, disconnect };
}
