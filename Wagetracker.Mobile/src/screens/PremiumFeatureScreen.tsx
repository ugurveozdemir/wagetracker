import React from 'react';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';

interface PremiumFeatureScreenProps {
    feature: 'goals' | 'expenses';
}

export const PremiumFeatureScreen: React.FC<PremiumFeatureScreenProps> = ({ feature }) => {
    return (
        <SubscriptionPaywall
            feature={feature}
            source={feature}
        />
    );
};
