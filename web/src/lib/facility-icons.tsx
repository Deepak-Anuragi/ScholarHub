import {
  BookOpen,
  Car,
  Droplets,
  Lock,
  Shield,
  Snowflake,
  Toilet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

const facilityIconMap: Record<string, LucideIcon> = {
  WiFi: Wifi,
  AC: Snowflake,
  Locker: Lock,
  "Drinking Water": Droplets,
  CCTV: Shield,
  Parking: Car,
  Washroom: Toilet,
  Generator: Zap,
  "Study Material": BookOpen,
  "Power Backup": Zap,
};

export function getFacilityIcon(name: string): LucideIcon {
  return facilityIconMap[name] ?? BookOpen;
}
