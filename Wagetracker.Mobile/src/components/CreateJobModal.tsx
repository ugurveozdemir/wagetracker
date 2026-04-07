import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useJobsStore } from '../stores';
import { colors } from '../theme';
import Toast from 'react-native-toast-message';

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const categories = [
    { id: 'housekeeper', label: 'HOUSEKEEPER', icon: 'cleaning-services' },
    { id: 'server', label: 'SERVER', icon: 'restaurant' },
    { id: 'driver', label: 'DRIVER', icon: 'directions-car' },
    { id: 'retail', label: 'RETAIL', icon: 'storefront' },
    { id: 'lifeguard', label: 'LIFEGUARD', icon: 'pool' },
    { id: 'barista', label: 'BARISTA', icon: 'local-cafe' },
    { id: 'custom', label: 'CUSTOM', icon: 'add' },
] as const;

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ visible, onClose, onCreated }) => {
    const { width } = useWindowDimensions();
    const { createJob, isCreating } = useJobsStore();
    const compact = width < 380;
    const scale = Math.min(Math.max(width / 393, 0.84), 1);

    const [title, setTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('custom');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setTitle('');
            setHourlyRate('');
            setSelectedCategory('custom');
            setError(null);
        }
    }, [visible]);

    const titlePlaceholder = useMemo(() => {
        if (selectedCategory === 'custom') return 'e.g. Resort Manager';
        return `e.g. ${categories.find((item) => item.id === selectedCategory)?.label ?? 'Seasonal Role'}`;
    }, [selectedCategory]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Job title is required');
            return;
        }

        if (!hourlyRate || Number.isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
            setError('Please enter a valid hourly rate');
            return;
        }

        try {
            await createJob({
                title: title.trim(),
                hourlyRate: parseFloat(hourlyRate),
                firstDayOfWeek: 1,
            });

            Toast.show({
                type: 'success',
                text1: 'Job Created',
                text2: `${title.trim()} has been added`,
                visibilityTime: 2000,
            });
            onCreated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create job';
            setError(message);
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
                        paddingHorizontal: compact ? 18 : 24,
                        paddingTop: compact ? 14 : 18,
                        paddingBottom: 36,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity style={styles.backRow} activeOpacity={0.8} onPress={onClose}>
                        <MaterialIcons name="arrow-back" size={20} color="#3f4942" />
                        <Text style={styles.backText}>Add New Job</Text>
                    </TouchableOpacity>

                    <Text style={[styles.heading, { fontSize: compact ? 40 : 46 }]}>New Adventure.</Text>
                    <Text style={styles.subheading}>
                        Let's track your next summer workspace. Fill in the details to start monitoring your earnings.
                    </Text>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.categoryPanel, { borderRadius: 999 }]}>
                        <Text style={styles.categoryTitle}>Select Job Category</Text>
                        <View style={styles.categoryGrid}>
                            {categories.map((item) => {
                                const active = selectedCategory === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.categoryItem, active && styles.categoryItemActive]}
                                        activeOpacity={0.88}
                                        onPress={() => setSelectedCategory(item.id)}
                                    >
                                        <View style={[styles.categoryIconWrap, active && styles.categoryIconWrapActive]}>
                                            <MaterialIcons
                                                name={item.icon}
                                                size={22}
                                                color={active ? colors.primary : '#8a948d'}
                                            />
                                        </View>
                                        <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 32 * scale }]}>
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="work" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>JOB TITLE</Text>
                        </View>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder={titlePlaceholder}
                            placeholderTextColor="#bec9bf"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: 32 * scale }]}>
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="payments" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>HOURLY RATE</Text>
                        </View>
                        <View style={styles.moneyField}>
                            <Text style={styles.moneyPrefix}>$</Text>
                            <TextInput
                                style={styles.moneyInput}
                                placeholder="25.00"
                                placeholderTextColor="#bec9bf"
                                value={hourlyRate}
                                onChangeText={setHourlyRate}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.moneySuffix}>/ hr</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isCreating}
                    >
                        <Text style={styles.submitButtonText}>{isCreating ? 'Saving...' : 'Save Job'}</Text>
                        <MaterialIcons name="rocket-launch" size={18} color="#412100" />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    container: {
        flex: 1,
        backgroundColor: '#fbf9f1',
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    backText: {
        color: '#3f4942',
        fontSize: 18,
        fontWeight: '700',
    },
    heading: {
        color: '#006D44',
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 10,
    },
    subheading: {
        color: '#3f4942',
        fontSize: 17,
        lineHeight: 27,
        marginBottom: 18,
    },
    errorBanner: {
        backgroundColor: '#fff1ef',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        marginBottom: 16,
    },
    errorText: {
        color: '#ba1a1a',
        fontSize: 14,
        fontWeight: '700',
    },
    categoryPanel: {
        backgroundColor: '#f1f5ef',
        paddingHorizontal: 18,
        paddingVertical: 24,
        marginBottom: 18,
    },
    categoryTitle: {
        color: '#2b7a57',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 18,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    categoryItem: {
        width: '28%',
        minWidth: 82,
        alignItems: 'center',
    },
    categoryItemActive: {},
    categoryIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    categoryIconWrapActive: {
        backgroundColor: '#ecf8f0',
        borderWidth: 1,
        borderColor: 'rgba(0,109,68,0.18)',
    },
    categoryLabel: {
        color: '#8a948d',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.6,
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: '#006D44',
    },
    fieldCard: {
        backgroundColor: '#f5f4eb',
        padding: 20,
        marginBottom: 16,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        paddingHorizontal: 6,
    },
    fieldLabel: {
        color: '#006D44',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.4,
    },
    fieldInput: {
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: '#181d19',
        fontSize: 18,
        fontWeight: '700',
    },
    moneyField: {
        backgroundColor: '#ffffff',
        borderRadius: 999,
        paddingLeft: 22,
        paddingRight: 20,
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
    },
    moneyPrefix: {
        color: '#6f7a71',
        fontSize: 22,
        fontWeight: '700',
        marginRight: 8,
    },
    moneyInput: {
        flex: 1,
        color: '#181d19',
        fontSize: 34,
        fontWeight: '700',
    },
    moneySuffix: {
        color: '#6f7a71',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: '#ff8a00',
        minHeight: 66,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#412100',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});
