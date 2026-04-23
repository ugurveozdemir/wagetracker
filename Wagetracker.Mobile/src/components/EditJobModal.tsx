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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useJobsStore } from '../stores';
import { JobResponse } from '../types';
import { colors, useResponsiveLayout } from '../theme';
import Toast from 'react-native-toast-message';

interface EditJobModalProps {
    visible: boolean;
    job: JobResponse | null;
    onClose: () => void;
    onUpdated: () => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({ visible, job, onClose, onUpdated }) => {
    const { horizontalPadding, isCompact: compact, metrics, rfs, rs, rv } = useResponsiveLayout();
    const { updateJob, isUpdating } = useJobsStore();

    const [title, setTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && job) {
            setTitle(job.title);
            setHourlyRate(job.hourlyRate.toString());
            setError(null);
        }
    }, [visible, job]);

    const titlePlaceholder = useMemo(() => `e.g. ${job?.title ?? 'Seasonal Role'}`, [job]);

    const handleSubmit = async () => {
        if (!job) return;

        if (!title.trim()) {
            setError('Job title is required');
            return;
        }

        if (!hourlyRate || Number.isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
            setError('Please enter a valid hourly rate');
            return;
        }

        try {
            await updateJob(job.id, {
                title: title.trim(),
                hourlyRate: parseFloat(hourlyRate),
                firstDayOfWeek: job.firstDayOfWeek,
            });

            Toast.show({
                type: 'success',
                text1: 'Job Updated',
                text2: `${title.trim()} has been updated`,
                visibilityTime: 2000,
            });
            onUpdated();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update job';
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
                        paddingHorizontal: horizontalPadding,
                        paddingTop: rv(compact ? 14 : 18, 0.72, 1),
                        paddingBottom: rv(36, 0.78, 1),
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity style={[styles.backRow, { marginBottom: rv(18, 0.74, 1) }]} activeOpacity={0.8} onPress={onClose}>
                        <MaterialIcons name="arrow-back" size={20} color="#3f4942" />
                        <Text style={[styles.backText, { fontSize: rfs(18, 0.9, 1) }]}>Edit Job</Text>
                    </TouchableOpacity>

                    <Text style={[styles.heading, { fontSize: rfs(compact ? 40 : 46, 0.82, 1) }]}>Refine Role.</Text>
                    <Text style={[styles.subheading, { fontSize: rfs(17, 0.88, 1), lineHeight: Math.round(rfs(17, 0.88, 1) * 1.55), marginBottom: rv(18, 0.74, 1) }]}>Update the tracked job details used by the backend ledger.</Text>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.fieldCard, { borderRadius: rs(32, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="work" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>JOB TITLE</Text>
                        </View>
                        <TextInput
                            style={[
                                styles.fieldInput,
                                {
                                    minHeight: metrics.compactInputHeight,
                                    paddingHorizontal: rs(20, 0.86, 1),
                                    paddingVertical: rv(16, 0.76, 1),
                                    fontSize: rfs(18, 0.88, 1),
                                },
                            ]}
                            placeholder={titlePlaceholder}
                            placeholderTextColor="#bec9bf"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={[styles.fieldCard, { borderRadius: rs(32, 0.86, 1), padding: rs(20, 0.84, 1), marginBottom: rv(16, 0.78, 1) }]}>
                        <View style={styles.fieldLabelRow}>
                            <MaterialIcons name="payments" size={16} color={colors.primary} />
                            <Text style={styles.fieldLabel}>HOURLY RATE</Text>
                        </View>
                        <View style={[styles.moneyField, { minHeight: metrics.compactInputHeight, paddingLeft: rs(22, 0.84, 1), paddingRight: rs(20, 0.84, 1) }]}>
                            <Text style={[styles.moneyPrefix, { fontSize: rfs(22, 0.88, 1) }]}>$</Text>
                            <TextInput
                                style={[styles.moneyInput, { fontSize: rfs(34, 0.82, 1) }]}
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
                        style={[
                            styles.submitButton,
                            {
                                minHeight: metrics.buttonHeight,
                                marginTop: rv(8, 0.72, 1),
                            },
                            isUpdating && styles.submitButtonDisabled,
                        ]}
                        activeOpacity={0.9}
                        onPress={handleSubmit}
                        disabled={isUpdating}
                    >
                        <Text style={[styles.submitButtonText, { fontSize: rfs(22, 0.86, 1) }]}>{isUpdating ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fbf9f1' },
    container: { flex: 1, backgroundColor: '#fbf9f1' },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
    backText: { color: '#3f4942', fontSize: 18, fontWeight: '700' },
    heading: { color: '#005232', fontWeight: '800', letterSpacing: -1.2, marginBottom: 10 },
    subheading: { color: '#3f4942', fontSize: 17, lineHeight: 27, marginBottom: 18 },
    errorBanner: { backgroundColor: '#fff1ef', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, marginBottom: 16 },
    errorText: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
    fieldCard: { backgroundColor: '#f5f4eb', padding: 20, marginBottom: 16 },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingHorizontal: 6 },
    fieldLabel: { color: '#005232', fontSize: 13, fontWeight: '700', letterSpacing: 1.4 },
    fieldInput: { backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 16, color: '#181d19', fontSize: 18, fontWeight: '700' },
    moneyField: { backgroundColor: '#ffffff', borderRadius: 999, paddingLeft: 22, paddingRight: 20, minHeight: 64, flexDirection: 'row', alignItems: 'center' },
    moneyPrefix: { color: '#6f7a71', fontSize: 22, fontWeight: '700', marginRight: 8 },
    moneyInput: { flex: 1, color: '#181d19', fontSize: 34, fontWeight: '700' },
    moneySuffix: { color: '#6f7a71', fontSize: 14, fontWeight: '600' },
    submitButton: { marginTop: 8, backgroundColor: '#ff8a00', minHeight: 66, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#412100', fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
});
