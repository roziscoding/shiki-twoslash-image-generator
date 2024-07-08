import { ref, watch } from "vue";
export const userPersistedRef = <T>(key: string, defaultValue: T) => {
  const stored = localStorage.getItem(key);
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue);

  watch(data, (value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return data;
};
