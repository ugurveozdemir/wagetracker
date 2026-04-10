import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';
import { RootStackParamList } from '../types';

type PaywallNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
type PaywallRouteProp = RouteProp<RootStackParamList, 'Paywall'>;

export const PaywallScreen: React.FC = () => {
    const navigation = useNavigation<PaywallNavigationProp>();
    const route = useRoute<PaywallRouteProp>();

    return (
        <SubscriptionPaywall
            feature={route.params.feature}
            source={route.params.source}
            showBackButton
            onBackPress={() => navigation.goBack()}
            onSuccess={() => navigation.goBack()}
        />
    );
};
