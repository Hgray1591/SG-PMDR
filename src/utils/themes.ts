import { Theme } from "../types";

export const themes: Theme[] = [
  {
    id: "sakura",
    name: "벚꽃",
    primaryColor: "#FFB7C5",
    secondaryColor: "#FFC0DB",
    backgroundColor: "#FFF0F5",
    textColor: "#4A4A4A",
    accentColor: "#FF69B4",
  },
  {
    id: "ocean",
    name: "바다",
    primaryColor: "#4FC3F7",
    secondaryColor: "#81D4FA",
    backgroundColor: "#E1F5FE",
    textColor: "#01579B",
    accentColor: "#0277BD",
  },
  {
    id: "sunset",
    name: "노을",
    primaryColor: "#FF7043",
    secondaryColor: "#FFAB91",
    backgroundColor: "#FBE9E7",
    textColor: "#BF360C",
    accentColor: "#E64A19",
  },
  {
    id: "forest",
    name: "삼림",
    primaryColor: "#81C784",
    secondaryColor: "#A5D6A7",
    backgroundColor: "#E8F5E9",
    textColor: "#2E7D32",
    accentColor: "#388E3C",
  },
  {
    id: "lavender",
    name: "라벤더",
    primaryColor: "#B39DDB",
    secondaryColor: "#D1C4E9",
    backgroundColor: "#F3E5F5",
    textColor: "#4A148C",
    accentColor: "#7B1FA2",
  },
  {
    id: "midnight",
    name: "미드나잇",
    primaryColor: "#5C6BC0",
    secondaryColor: "#7986CB",
    backgroundColor: "#1A237E",
    textColor: "#E8EAF6",
    accentColor: "#3F51B5",
  },
  {
    id: "monochrome-white",
    name: "모노톤1",
    primaryColor: "#9E9E9E",
    secondaryColor: "#BDBDBD",
    backgroundColor: "#FAFAFA",
    textColor: "#424242",
    accentColor: "#616161",
  },
  {
    id: "monochrome-black",
    name: "모노톤2",
    primaryColor: "#757575",
    secondaryColor: "#616161",
    backgroundColor: "#212121",
    textColor: "#E0E0E0",
    accentColor: "#9E9E9E",
  },
  {
    id: "dandelion",
    name: "민들레",
    primaryColor: "#FFD54F",
    secondaryColor: "#FFE082",
    backgroundColor: "#FFF9C4",
    textColor: "#F57F17",
    accentColor: "#FBC02D",
  },
];

export const getTheme = (themeId: string): Theme => {
  return themes.find((t) => t.id === themeId) || themes[0];
};
