import React, { useEffect, useState } from 'react';
import {
    Alert,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    KeyboardAvoidingView,
    ScrollView,
    TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useExpenseStore } from '../stores';
import { EXPENSE_CATEGORIES, ReceiptScanItemDraft } from '../types';
import { useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

interface AddExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const MAX_RECEIPT_IMAGE_DIMENSION = 1600;
const RECEIPT_IMAGE_QUALITY = 0.7;
const ITEM_TAGS = ['groceries', 'snacks', 'ready_meal', 'household', 'personal_care', 'clothing', 'school', 'medicine', 'electronics', 'transport', 'tax_fee', 'discount', 'adjustment', 'other'] as const;

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    visible,
    onClose,
    onCreated,
}) => {
    const { horizontalPadding, isCompact: compact, metrics, rfs, rs, rv } = useResponsiveLayout();
    const { createExpense, confirmReceiptScan, scanReceipt, isLoading } = useExpenseStore();
    const canScanReceipt = Platform.OS !== 'web';

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(7);
    const [date, setDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [purchaseMode, setPurchaseMode] = useState<'single' | 'multi'>('single');
    const [merchantName, setMerchantName] = useState('');
    const [subtotalAmount, setSubtotalAmount] = useState<number | null>(null);
    const [taxAmount, setTaxAmount] = useState<number | null>(null);
    const [discountAmount, setDiscountAmount] = useState<number | null>(null);
    const [receiptItems, setReceiptItems] = useState<ReceiptScanItemDraft[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isReceiptDraft, setIsReceiptDraft] = useState(false);
    const [scanConfidence, setScanConfidence] = useState<number | null>(null);
    const [scanWarnings, setScanWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setAmount('');
            setCategory(7);
            setDate(new Date());
            setDescription('');
            setPurchaseMode('single');
            setMerchantName('');
            setSubtotalAmount(null);
            setTaxAmount(null);
            setDiscountAmount(null);
            setReceiptItems([]);
            setError(null);
            setShowDatePicker(false);
            setIsScanning(false);
            setIsReceiptDraft(false);
            setScanConfidence(null);
            setScanWarnings([]);
        }
    }, [visible]);

    const formatDateForApi = (value: Date) => value.toISOString().split('T')[0];

    const dateFromApiValue = (value: string) => {
        const datePart = value.split('T')[0];
        return new Date(`${datePart}T12:00:00`);
    };

    const getResizeActions = (asset: ImagePicker.ImagePickerAsset): ImageManipulator.Action[] => {
        if (!asset.width || !asset.height) {
            return [];
        }

        const longestSide = Math.max(asset.width, asset.height);
        if (longestSide <= MAX_RECEIPT_IMAGE_DIMENSION) {
            return [];
        }

        if (asset.width >= asset.height) {
            return [{ resize: { width: MAX_RECEIPT_IMAGE_DIMENSION } }];
        }

        return [{ resize: { height: MAX_RECEIPT_IMAGE_DIMENSION } }];
    };

    const getImagePayload = async (asset: ImagePicker.ImagePickerAsset) => {
        const preparedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            getResizeActions(asset),
            {
                compress: RECEIPT_IMAGE_QUALITY,
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );

        return {
            uri: preparedImage.uri,
            name: 'receipt.jpg',
            type: 'image/jpeg',
        };
    };

    const applyReceiptDraft = (draft: Awaited<ReturnType<typeof scanReceipt>>) => {
        if (draft.amount && draft.amount > 0) {
            setAmount(draft.amount.toFixed(2));
        }

        if (draft.date) {
            setDate(dateFromApiValue(draft.date));
        }

        setCategory(draft.category);
        setDescription(draft.description || '');
        setMerchantName(draft.merchantName || '');
        setSubtotalAmount(draft.subtotalAmount);
        setTaxAmount(draft.taxAmount);
        setDiscountAmount(draft.discountAmount);
        setReceiptItems(draft.items || []);
        setPurchaseMode((draft.items || []).length > 0 ? 'multi' : 'single');
        setIsReceiptDraft(true);
        setScanConfidence(draft.confidence);
        setScanWarnings(draft.warnings || []);
        setError(null);

        Toast.show({
            type: draft.confidence >= 0.7 ? 'success' : 'info',
            text1: draft.confidence >= 0.7 ? 'Receipt Scanned' : 'Review Needed',
            text2: 'Check the fields before saving.',
            visibilityTime: 2200,
        });
    };

    const scanSelectedImage = async (asset: ImagePicker.ImagePickerAsset) => {
        setIsScanning(true);
        setError(null);

        try {
            const draft = await scanReceipt(await getImagePayload(asset));
            applyReceiptDraft(draft);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to scan receipt';
            setError(message);
        } finally {
            setIsScanning(false);
        }
    };

    const chooseReceiptFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            setError('Camera permission is required to scan a receipt.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await scanSelectedImage(result.assets[0]);
        }
    };

    const chooseReceiptFromLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError('Photo library permission is required to choose a receipt.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await scanSelectedImage(result.assets[0]);
        }
    };

    const handleScanReceipt = () => {
        if (!canScanReceipt || isScanning) {
            return;
        }

        Alert.alert('Scan Receipt', 'Choose a receipt image.', [
            { text: 'Take Photo', onPress: chooseReceiptFromCamera },
            { text: 'Choose from Gallery', onPress: chooseReceiptFromLibrary },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const itemTotal = receiptItems.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    const parsedParentAmount = parseFloat(amount);
    const itemDifference = !Number.isNaN(parsedParentAmount) && receiptItems.length > 0
        ? parsedParentAmount - itemTotal
        : 0;

    const updateReceiptItem = (index: number, updates: Partial<ReceiptScanItemDraft>) => {
        setReceiptItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)));
    };

    const addReceiptItem = () => {
        setReceiptItems((items) => [
            ...items,
            {
                name: '',
                totalAmount: 0,
                quantity: null,
                unitPrice: null,
                category: 7,
                tag: 'other',
                kind: 'Product',
                confidence: null,
            },
        ]);
    };

    const removeReceiptItem = (index: number) => {
        setReceiptItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);

        if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            const payload = {
                amount: parsedAmount,
                category,
                date: formatDateForApi(date),
                description: description.trim() || undefined,
            };

            if (isReceiptDraft || (purchaseMode === 'multi' && receiptItems.some((item) => item.name.trim() && Number(item.totalAmount) !== 0))) {
                await confirmReceiptScan({
                    ...payload,
                    merchantName: merchantName.trim() || undefined,
                    subtotalAmount,
                    taxAmount,
                    discountAmount,
                    receiptScanConfidence: scanConfidence,
                    warnings: scanWarnings,
                    items: receiptItems
                        .filter((item) => item.name.trim() && Number(item.totalAmount) !== 0)
                        .map((item) => ({
                            ...item,
                            name: item.name.trim(),
                            totalAmount: Number(item.totalAmount) || 0,
                        })),
                });
            } else {
                await createExpense(payload);
            }

            Toast.show({
                type: 'success',
                text1: 'Expense Added',
                text2: `$${parsedAmount.toFixed(2)} recorded successfully`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add expense';
            setError(message);
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.safeArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{
                        paddingHorizontal: horizontalPadding,
                        paddingTop: rv(12, 0.72, 1),
                        paddingBottom: rv(36, 0.78, 1),
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.heroCard, { borderRadius: rs(40, 0.84, 1), padding: rs(28, 0.84, 1), marginBottom: rv(18, 0.78, 1) }]}>
                        <Text style={styles.heroLabel}>NEW EXPENSE</Text>
                        <Text style={[styles.heroValue, { fontSize: rfs(compact ? 42 : 50, 0.82, 1) }]}>${amount || '0.00'}</Text>
                        <Text style={[styles.heroSubtext, { fontSize: rfs(14, 0.9, 1), lineHeight: Math.round(rfs(14, 0.9, 1) * 1.55) }]}>{purchaseMode === 'multi' ? 'Review the receipt total and item-level sub-buyings.' : 'Record the amount, category, date and an optional description.'}</Text>
                    </View>

                    <View style={styles.modeSwitch}>
                        <TouchableOpacity
                            style={[styles.modeButton, purchaseMode === 'single' && styles.modeButtonActive]}
                            activeOpacity={0.88}
                            onPress={() => setPurchaseMode('single')}
                        >
                            <Text style={[styles.modeButtonText, purchaseMode === 'single' && styles.modeButtonTextActive]}>Single purchase</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, purchaseMode === 'multi' && styles.modeButtonActive]}
                            activeOpacity={0.88}
                            onPress={() => setPurchaseMode('multi')}
                        >
                            <Text style={[styles.modeButtonText, purchaseMode === 'multi' && styles.modeButtonTextActive]}>Receipt items</Text>
                        </TouchableOpacity>
                    </View>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {canScanReceipt ? (
                        <TouchableOpacity
                            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                            activeOpacity={0.88}
                            onPress={handleScanReceipt}
                            disabled={isScanning || isLoading}
                        >
                            <MaterialIcons name="document-scanner" size={20} color="#005232" />
                            <Text style={styles.scanButtonText}>{isScanning ? 'Scanning receipt...' : 'Scan Receipt'}</Text>
                        </TouchableOpacity>
                    ) : null}

                    {isReceiptDraft ? (
                        <View style={styles.scanSummary}>
                            <View style={styles.scanSummaryHeader}>
                                <MaterialIcons name="auto-awesome" size={18} color="#005232" />
                                <Text style={styles.scanSummaryTitle}>Review scanned receipt</Text>
                            </View>
                            {scanConfidence !== null ? (
                                <Text style={styles.scanSummaryText}>Confidence: {Math.round(scanConfidence * 100)}%</Text>
                            ) : null}
                            {scanWarnings.map((warning) => (
                                <Text key={warning} style={styles.scanWarningText}>{warning}</Text>
                            ))}
                            {purchaseMode === 'multi' && receiptItems.length > 0 ? (
                                <Text style={styles.scanSummaryText}>
                                    {receiptItems.length} items detected. Item total: ${itemTotal.toFixed(2)}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    {purchaseMode === 'multi' ? (
                        <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                            <Text style={styles.fieldLabel}>Receipt</Text>
                            <TextInput
                                style={[styles.standardInput, { minHeight: metrics.compactInputHeight, fontSize: rfs(16, 0.9, 1) }]}
                                placeholder="Merchant name"
                                placeholderTextColor="#bec9bf"
                                value={merchantName}
                                onChangeText={setMerchantName}
                            />
                        </View>
                    ) : null}

                    <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <Text style={[styles.fieldLabel, { fontSize: rfs(16, 0.9, 1), marginBottom: rv(12, 0.74, 1) }]}>Amount</Text>
                        <View style={[styles.moneyField, { minHeight: metrics.compactInputHeight, paddingHorizontal: rs(18, 0.86, 1) }]}>
                            <Text style={[styles.moneyPrefix, { fontSize: rfs(18, 0.9, 1) }]}>$</Text>
                            <TextInput
                                style={[styles.moneyInput, { fontSize: rfs(24, 0.86, 1) }]}
                                placeholder="25.50"
                                placeholderTextColor="#bec9bf"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <Text style={[styles.fieldLabel, { fontSize: rfs(16, 0.9, 1), marginBottom: rv(12, 0.74, 1) }]}>Category</Text>
                        <View style={styles.categoryWrap}>
                            {EXPENSE_CATEGORIES.map((item) => {
                                const active = item.id === category;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                                        activeOpacity={0.88}
                                        onPress={() => setCategory(item.id)}
                                    >
                                        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <Text style={[styles.fieldLabel, { fontSize: rfs(16, 0.9, 1), marginBottom: rv(12, 0.74, 1) }]}>Date</Text>
                        <TouchableOpacity style={[styles.dateButton, { minHeight: metrics.compactInputHeight, paddingHorizontal: rs(18, 0.86, 1) }]} activeOpacity={0.88} onPress={() => setShowDatePicker(true)}>
                            <Text style={[styles.dateText, { fontSize: rfs(18, 0.9, 1) }]}>
                                {date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </Text>
                            <MaterialIcons name="calendar-today" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && Platform.OS === 'ios' ? (
                        <View style={styles.pickerWrap}>
                            <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.pickerDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker value={date} mode="date" display="inline" onChange={onDateChange} themeVariant="dark" />
                        </View>
                    ) : null}

                    {showDatePicker && Platform.OS === 'android' ? (
                        <DateTimePicker value={date} mode="date" display="calendar" onChange={onDateChange} />
                    ) : null}

                    <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <Text style={[styles.fieldLabel, { fontSize: rfs(16, 0.9, 1), marginBottom: rv(12, 0.74, 1) }]}>Description</Text>
                        <TextInput
                            style={[
                                styles.descriptionInput,
                                {
                                    minHeight: rv(110, 0.78, 1),
                                    borderRadius: rs(24, 0.86, 1),
                                    fontSize: rfs(16, 0.9, 1),
                                    lineHeight: Math.round(rfs(16, 0.9, 1) * 1.5),
                                },
                            ]}
                            multiline
                            placeholder="Optional note for this expense..."
                            placeholderTextColor="#bec9bf"
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    {purchaseMode === 'multi' ? (
                        <View style={[styles.fieldCard, { borderRadius: rs(28, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                            <View style={styles.itemsHeader}>
                                <Text style={styles.fieldLabel}>Sub-buyings</Text>
                                <TouchableOpacity onPress={addReceiptItem} activeOpacity={0.8}>
                                    <Text style={styles.addItemText}>Add item</Text>
                                </TouchableOpacity>
                            </View>
                            {receiptItems.length === 0 ? (
                                <Text style={styles.emptyItemsText}>Scan a receipt or add items to break down this purchase.</Text>
                            ) : (
                                receiptItems.map((item, index) => (
                                    <View key={`${index}-${item.name}`} style={styles.receiptItemRow}>
                                        <View style={styles.receiptItemTopRow}>
                                            <TextInput
                                                style={[styles.itemNameInput, { borderRadius: rs(16, 0.86, 1), minHeight: metrics.touchTarget }]}
                                                placeholder="Item name"
                                                placeholderTextColor="#bec9bf"
                                                value={item.name}
                                                onChangeText={(value) => updateReceiptItem(index, { name: value })}
                                            />
                                            <TextInput
                                                style={[styles.itemAmountInput, { borderRadius: rs(16, 0.86, 1), minHeight: metrics.touchTarget }]}
                                                placeholder="0.00"
                                                placeholderTextColor="#bec9bf"
                                                value={String(item.totalAmount || '')}
                                                onChangeText={(value) => updateReceiptItem(index, { totalAmount: parseFloat(value) || 0 })}
                                                keyboardType="decimal-pad"
                                            />
                                            <TouchableOpacity style={styles.removeItemButton} onPress={() => removeReceiptItem(index)} activeOpacity={0.8}>
                                                <MaterialIcons name="close" size={16} color="#7a573d" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.itemChipWrap}>
                                            {ITEM_TAGS.slice(0, 7).map((tag) => (
                                                <TouchableOpacity
                                                    key={tag}
                                                    style={[styles.itemTagChip, item.tag === tag && styles.itemTagChipActive]}
                                                    onPress={() => updateReceiptItem(index, { tag })}
                                                    activeOpacity={0.82}
                                                >
                                                    <Text style={[styles.itemTagText, item.tag === tag && styles.itemTagTextActive]}>
                                                        {tag.replace('_', ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))
                            )}
                            {receiptItems.length > 0 ? (
                                <View style={styles.reconcileRow}>
                                    <Text style={styles.reconcileText}>Items ${itemTotal.toFixed(2)}</Text>
                                    <Text style={Math.abs(itemDifference) > 0.01 ? styles.reconcileWarning : styles.reconcileText}>
                                        Difference ${itemDifference.toFixed(2)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            {
                                minHeight: metrics.buttonHeight,
                                marginTop: rv(8, 0.72, 1),
                            },
                            isLoading && styles.submitButtonDisabled,
                        ]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isLoading || isScanning}
                    >
                        <Text style={[styles.submitButtonText, { fontSize: rfs(20, 0.86, 1) }]}>{isLoading ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fbf9f1' },
    container: { flex: 1, backgroundColor: '#fbf9f1' },
    heroCard: { backgroundColor: '#ff8a00', marginBottom: 18 },
    heroLabel: { color: 'rgba(65,33,0,0.80)', fontSize: 12, fontWeight: '700', letterSpacing: 1.7, marginBottom: 8 },
    heroValue: { color: '#412100', fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
    heroSubtext: { color: 'rgba(65,33,0,0.80)', fontSize: 14, lineHeight: 22 },
    modeSwitch: { backgroundColor: '#f5f4eb', borderRadius: 24, padding: 6, marginBottom: 16, flexDirection: 'row', gap: 6 },
    modeButton: { flex: 1, minHeight: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    modeButtonActive: { backgroundColor: '#ffffff' },
    modeButtonText: { color: '#6f7a71', fontSize: 13, fontWeight: '800' },
    modeButtonTextActive: { color: '#005232' },
    errorBanner: { backgroundColor: '#fff1ef', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, marginBottom: 16 },
    errorText: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
    scanButton: { backgroundColor: '#ecf8f0', minHeight: 58, borderRadius: 24, marginBottom: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    scanButtonDisabled: { opacity: 0.7 },
    scanButtonText: { color: '#005232', fontSize: 16, fontWeight: '800' },
    scanSummary: { backgroundColor: '#ecf8f0', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, marginBottom: 16 },
    scanSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    scanSummaryTitle: { color: '#005232', fontSize: 14, fontWeight: '800' },
    scanSummaryText: { color: '#4f5a53', fontSize: 13, fontWeight: '700', marginBottom: 4 },
    scanWarningText: { color: '#7a573d', fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 2 },
    fieldCard: { backgroundColor: '#f5f4eb', padding: 20, marginBottom: 16 },
    fieldLabel: { color: '#181d19', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    standardInput: { backgroundColor: '#ffffff', borderRadius: 24, minHeight: 56, paddingHorizontal: 18, color: '#181d19', fontSize: 16, fontWeight: '700' },
    moneyField: { backgroundColor: '#ffffff', borderRadius: 999, minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    moneyPrefix: { color: '#6f7a71', fontSize: 18, fontWeight: '700', marginRight: 8, lineHeight: 22 },
    moneyInput: { flex: 1, color: '#181d19', fontSize: 24, fontWeight: '700', paddingTop: 8, paddingBottom: 0, textAlignVertical: 'center' },
    categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryChip: { backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
    categoryChipActive: { backgroundColor: '#ecf8f0' },
    categoryChipText: { color: '#4f5a53', fontSize: 13, fontWeight: '700' },
    categoryChipTextActive: { color: '#005232' },
    dateButton: { backgroundColor: '#ffffff', borderRadius: 999, minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateText: { color: '#181d19', fontSize: 18, fontWeight: '700' },
    descriptionInput: { backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 16, color: '#181d19', fontSize: 16, lineHeight: 24 },
    itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    addItemText: { color: '#005232', fontSize: 13, fontWeight: '800' },
    emptyItemsText: { color: '#6f7a71', fontSize: 13, fontWeight: '600', lineHeight: 20 },
    receiptItemRow: { backgroundColor: '#ffffff', borderRadius: 22, padding: 12, marginBottom: 10 },
    receiptItemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemNameInput: { flex: 1, backgroundColor: '#f5f4eb', minHeight: 46, paddingHorizontal: 12, color: '#181d19', fontSize: 14, fontWeight: '700' },
    itemAmountInput: { width: 86, backgroundColor: '#f5f4eb', minHeight: 46, paddingHorizontal: 10, color: '#181d19', fontSize: 14, fontWeight: '800', textAlign: 'right' },
    removeItemButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff1e8', alignItems: 'center', justifyContent: 'center' },
    itemChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    itemTagChip: { backgroundColor: '#f5f4eb', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
    itemTagChipActive: { backgroundColor: '#ecf8f0' },
    itemTagText: { color: '#6f7a71', fontSize: 11, fontWeight: '700' },
    itemTagTextActive: { color: '#005232' },
    reconcileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    reconcileText: { color: '#4f5a53', fontSize: 13, fontWeight: '700' },
    reconcileWarning: { color: '#7a573d', fontSize: 13, fontWeight: '800' },
    submitButton: { marginTop: 8, backgroundColor: '#ff8a00', minHeight: 64, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#412100', fontSize: 20, fontWeight: '800' },
    pickerWrap: { backgroundColor: '#111827', borderRadius: 24, overflow: 'hidden', marginBottom: 18 },
    pickerHeader: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827' },
    pickerDone: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
