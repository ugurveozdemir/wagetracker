# WageTracker - Yapılacaklar Listesi

---

## � FRONTEND (Mobile App)

### �🔴 Kritik / Öncelikli

#### Error Handling
- [x] Toast notifications sistemi (react-native-toast-message)
- [x] API hata mesajlarını kullanıcıya göster
- [ ] Network hatalarında retry butonu

#### Form Validation (UX için)
- [x] Email format kontrolü (regex)
- [ ] Password strength indicator
- [x] Boş alan uyarıları

#### Offline Desteği (İleri Seviye)
- [ ] AsyncStorage ile local cache
- [ ] Offline modda entry ekleme
- [ ] İnternet gelince sync

### 🟡 UX İyileştirmeleri

#### Dashboard
- [ ] Pull-to-refresh
- [ ] Skeleton loading states
- [ ] Empty state (iş yokken güzel görsel)

#### Entry Yönetimi
- [x] Entry silme (swipe-to-delete)
- [ ] Entry düzenleme

#### Job Yönetimi
- [ ] Job düzenleme
- [x] Job silme (onay dialogu ile)
- [ ] Job arşivleme

#### Auth
- [ ] Forgot password flow
- [ ] Remember me checkbox
- [ ] Biometric login (Face ID / Fingerprint)

### 🟢 Yeni Özellikler

#### Gider Takibi
- [ ] AddExpenseModal
- [ ] ExpensesScreen
- [ ] Kategoriler (yemek, ulaşım, vb)

#### Raporlama
- [ ] Haftalık/aylık özet grafikler
- [ ] PDF export

#### Diğer
- [ ] Çoklu para birimi desteği
- [ ] Dark mode

---

## 🖥️ BACKEND (API)

### 🔴 Kritik / Güvenlik

#### Input Validation (Data Annotations)
- [ ] RegisterRequest: Email format kontrolü ([EmailAddress])
- [ ] RegisterRequest: Password min 6 karakter ([MinLength(6)])
- [ ] RegisterRequest: FullName zorunlu ([Required])
- [ ] LoginRequest: Email ve Password zorunlu ([Required])
- [ ] CreateJobRequest: Title zorunlu, HourlyRate > 0
- [ ] CreateEntryRequest: Date zorunlu, TotalHours > 0

#### Güvenlik
- [ ] Rate limiting (brute force koruması)
- [ ] Password complexity rules
- [ ] Token refresh mechanism

### 🟡 İyileştirmeler

- [ ] Expense entity + API endpoints
- [ ] Email ile rapor gönder
- [ ] Bildirimler (push notification)

---

## ✅ Tamamlananlar

### 1 Ocak 2026
- [x] Tarih formatı güncellendi (gün/ay)
- [x] Inline takvim picker (iOS/Android)
- [x] Toast notifications sistemi

### 21 Aralık 2025
- [x] Swipe-to-dismiss modal
- [x] Keyboard handling (KeyboardAwareScrollView)
- [x] Date format (Dec 21, 2025)
- [x] Dark theme iOS picker
- [x] Picker conflict fix
- [x] Auth flow (login, register, logout)
- [x] Dashboard summary cards
- [x] Job details + weekly grouping
- [x] Overtime calculation (40h @ 1.5x)
