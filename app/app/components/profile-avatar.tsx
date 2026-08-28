"use client";

import Image from "next/image";
import { useState } from "react";

export function ProfileAvatar({ url, initials }: { url?: string | null; initials: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <>{initials}</>;
  return <Image className="user-avatar-image" src={url} alt="" fill sizes="42px" unoptimized onError={() => setFailed(true)} />;
}
