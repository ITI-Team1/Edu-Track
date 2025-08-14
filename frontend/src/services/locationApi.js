import api from "./api";

export const fetchLocations = async () => {
  const res = await fetch(`${api.baseURL}/location/`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error("فشل في جلب القاعات");
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.results ?? []);
};

export const createLocation = async (formData) => {
  // Expecting formData = { name, slug, capacity?, faculty }
  if (!formData?.slug) throw new Error('المعرف (Slug) مطلوب');
  const payload = {
    name: formData.name,
    slug: formData.slug,
    capacity: Number(formData.capacity ?? 1),
    faculty: Number(formData.faculty),
  };
  const res = await fetch(`${api.baseURL}/location/create/`, {
    method: "POST",
    headers: api.getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const firstFieldError = err && typeof err === 'object' ? Object.values(err)[0]?.[0] : null;
    throw new Error(err?.detail || err?.non_field_errors?.[0] || firstFieldError || err?.message || "فشل في إنشاء القاعة");
  }
  return res.json();
};

export const updateLocation = async (slug, formData) => {
  if (!formData?.slug) throw new Error('المعرف (Slug) مطلوب');
  const payload = {
    name: formData.name,
    slug: formData.slug,
    capacity: formData.capacity != null ? Number(formData.capacity) : undefined,
    faculty: formData.faculty != null ? Number(formData.faculty) : undefined,
  };
  const res = await fetch(`${api.baseURL}/location/${slug}/update/`, {
    method: "PUT",
    headers: api.getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const firstFieldError = err && typeof err === 'object' ? Object.values(err)[0]?.[0] : null;
    throw new Error(err?.detail || err?.non_field_errors?.[0] || firstFieldError || err?.message || "فشل في تحديث القاعة");
  }
  return res.json();
};

export const deleteLocation = async (slug) => {
  const res = await fetch(`${api.baseURL}/location/${slug}/delete/`, {
    method: "DELETE",
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error("فشل في حذف القاعة");
  return true;
};