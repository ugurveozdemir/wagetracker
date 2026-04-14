import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LockedFeatureScreen } from '../components/LockedFeaturePreview';
import { RootStackParamList } from '../types';

type PremiumFeatureNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PremiumFeatureScreenProps {
    feature: 'goals' | 'expenses';
}

export const PremiumFeatureScreen: React.FC<PremiumFeatureScreenProps> = ({ feature }) => {
    const navigation = useNavigation<PremiumFeatureNavigationProp>();

    return (
        <LockedFeatureScreen
            feature={feature}
            previewVariant={feature === 'expenses' ? 'weeklyLedger' : 'metrics'}
            onUnlock={() => navigation.navigate('Paywall', { source: feature, feature })}
        />
    );
};
