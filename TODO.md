# WageTracker - Yapılacaklar Listesi

## 🔴 Kritik / Öncelikli

### Error Handling
- [ ] Toast notifications sistemi (react-native-toast-message)
- [ ] API hata mesajlarını kullanıcıya göster
- [ ] Network hatalarında retry butonu

### Form Validation
- [ ] Email format kontrolü (regex)
- [ ] Password strength indicator
- [ ] Boş alan uyarıları iyileştir

### Offline Desteği (İleri Seviye)
- [ ] AsyncStorage ile local cache
- [ ] Offline modda entry ekleme
- [ ] İnternet gelince sync

---

## 🟡 UX İyileştirmeleri

### Dashboard
- [ ] Pull-to-refresh (5 dk)
- [ ] Skeleton loading states
- [ ] Empty state (iş yokken güzel görsel)

### Entry Yönetimi
- [ ] Entry silme (swipe-to-delete)
- [ ] Entry düzenleme

### Job Yönetimi
- [ ] Job düzenleme
- [ ] Job silme (onay dialogu ile)
- [ ] Job arşivleme

### Auth
- [ ] Forgot password flow
- [ ] Remember me checkbox
- [ ] Biometric login (Face ID / Fingerprint)

---

## 🟢 Yeni Özellikler (Sonraki Fazlar)

### Gider Takibi
- [ ] Expense entity + API
- [ ] AddExpenseModal
- [ ] ExpensesScreen
- [ ] Kategoriler (yemek, ulaşım, vb)

### Raporlama
- [ ] Haftalık/aylık özet grafikler
- [ ] PDF export
- [ ] Email ile rapor gönder

### Diğer
- [ ] Çoklu para birimi desteği
- [ ] Bildirimler (vardiya hatırlatma)
- [ ] Dark mode

---

## ✅ Tamamlananlar (21 Aralık 2025)

- [x] Swipe-to-dismiss modal
- [x] Keyboard handling (KeyboardAwareScrollView)
- [x] Date format (Dec 21, 2025)
- [x] Dark theme iOS picker
- [x] Picker conflict fix
- [x] Auth flow (login, register, logout)
- [x] Dashboard summary cards
- [x] Job details + weekly grouping
- [x] Overtime calculation (40h @ 1.5x)
