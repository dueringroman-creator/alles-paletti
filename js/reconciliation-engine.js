// ============================================
// RECONCILIATION ENGINE - EXPERT RECOMMENDATIONS
// ============================================

/**
 * Pallet Exchange Reconciliation Engine
 *
 * Provides intelligent recommendations for resolving equipment variances
 * based on industry expertise in pallet pooling, transport economics,
 * and multi-party settlement.
 */

const ReconciliationEngine = {
    // Industry standard costs (€)
    COSTS: {
        EUR_PALLET_VALUE: 15.00,        // Replacement value EUR pallet
        H1_PALLET_VALUE: 25.00,         // Plastic H1 pallet
        CAGE_VALUE: 150.00,             // Roll cage
        IBC_VALUE: 45.00,               // IBC container

        PSP_PICKUP_BASE: 85.00,         // Base PSP pickup cost
        PSP_PICKUP_PER_UNIT: 0.50,      // Per pallet handling
        PSP_POOLING_MONTHLY: 2.50,      // Monthly pooling fee per unit

        CARRIER_SURCHARGE_LTL: 45.00,   // LTL surcharge for return load
        CARRIER_SURCHARGE_FTL: 0.00,    // No surcharge for FTL (already priced)

        INVOICE_ADMIN_FEE: 15.00,       // Administrative cost of invoicing
        DISPUTE_HANDLING_COST: 120.00,  // Average cost to resolve dispute
    },

    // Thresholds
    THRESHOLDS: {
        FTL_EURO_PALLETS: 33,          // 33 stacks = 1 FTL (standard)
        FTL_CAGES: 18,                  // Roll cages per FTL
        FTL_IBC: 20,                    // IBCs per FTL

        MIN_PSP_QUANTITY: 10,           // Minimum for PSP to handle
        MAX_INVOICE_VARIANCE: 50,       // Max units before alternative required

        DISTANCE_SHORT: 100,            // km - short haul
        DISTANCE_MEDIUM: 300,           // km - medium haul
        DISTANCE_LONG: 500,             // km - long haul
    },

    /**
     * Analyze variance and provide expert recommendations
     */
    analyzeVariance(reconciliation) {
        const {
            bookingId,
            bookingNumber,
            equipmentType,
            expected,
            observed,
            variance,
            origin,
            destination,
            carrier,
            distance = 250, // default km
        } = reconciliation;

        if (variance === 0) {
            return {
                severity: 'none',
                recommendations: [],
                estimatedCost: 0
            };
        }

        const absVariance = Math.abs(variance);
        const isSurplus = variance > 0;
        const isDeficit = variance < 0;

        // Calculate base financial impact
        const unitValue = this.getUnitValue(equipmentType);
        const replacementCost = absVariance * unitValue;

        // Generate recommendations based on expertise
        const recommendations = [];

        // Recommendation 1: Simple Invoice (baseline)
        const invoiceOption = this.calculateInvoiceOption(
            absVariance,
            unitValue,
            isSurplus
        );
        recommendations.push(invoiceOption);

        // Recommendation 2: PSP Pickup & Pooling
        if (absVariance >= this.THRESHOLDS.MIN_PSP_QUANTITY) {
            const pspOption = this.calculatePSPOption(
                absVariance,
                equipmentType,
                distance,
                isSurplus
            );
            recommendations.push(pspOption);
        }

        // Recommendation 3: Carrier Backhaul (if FTL or near-FTL)
        if (this.isNearFTL(absVariance, equipmentType)) {
            const backhaulOption = this.calculateBackhaulOption(
                absVariance,
                equipmentType,
                distance,
                carrier,
                isSurplus
            );
            recommendations.push(backhaulOption);
        }

        // Recommendation 4: Hybrid Solution (for large variances)
        if (absVariance > this.THRESHOLDS.MAX_INVOICE_VARIANCE) {
            const hybridOption = this.calculateHybridOption(
                absVariance,
                equipmentType,
                distance,
                isSurplus
            );
            recommendations.push(hybridOption);
        }

        // Recommendation 5: Write-Off (if variance is very small)
        if (absVariance <= 5 && replacementCost < 100) {
            const writeOffOption = {
                id: 'writeoff',
                title: 'Write-Off as Operational Loss',
                description: `Small variance (${absVariance} units) below materiality threshold. Write off as normal operational variance.`,
                totalCost: 0,
                savings: replacementCost,
                timeline: 'Immediate',
                effort: 'Low',
                recommended: replacementCost < 50,
                breakdown: [
                    { item: 'Variance value', cost: replacementCost },
                    { item: 'Administrative cost avoided', cost: -this.COSTS.INVOICE_ADMIN_FEE },
                    { item: 'Net impact', cost: replacementCost - this.COSTS.INVOICE_ADMIN_FEE }
                ],
                pros: [
                    'Zero administrative effort',
                    'Maintains carrier relationship',
                    'Faster resolution'
                ],
                cons: [
                    `Absorbs €${replacementCost.toFixed(2)} cost`,
                    'Sets precedent for future variances'
                ]
            };
            recommendations.push(writeOffOption);
        }

        // Sort by total cost (cheapest first)
        recommendations.sort((a, b) => a.totalCost - b.totalCost);

        // Mark cheapest as recommended if not already marked
        if (recommendations.length > 0 && !recommendations.some(r => r.recommended)) {
            recommendations[0].recommended = true;
        }

        return {
            severity: this.getSeverity(absVariance, replacementCost),
            financialImpact: replacementCost,
            recommendations,
            analytics: {
                isFTL: this.isFTL(absVariance, equipmentType),
                isNearFTL: this.isNearFTL(absVariance, equipmentType),
                isPSPEligible: absVariance >= this.THRESHOLDS.MIN_PSP_QUANTITY,
                distanceCategory: this.getDistanceCategory(distance),
                unitValue,
                absVariance
            }
        };
    },

    /**
     * Calculate simple invoice option
     */
    calculateInvoiceOption(quantity, unitValue, isSurplus) {
        const equipmentCost = quantity * unitValue;
        const adminCost = this.COSTS.INVOICE_ADMIN_FEE;
        const totalCost = equipmentCost + adminCost;

        return {
            id: 'invoice',
            title: 'Invoice for Equipment Value',
            description: isSurplus
                ? `Credit carrier/consignee for ${quantity} surplus units received.`
                : `Invoice carrier/shipper for ${quantity} missing units.`,
            totalCost,
            savings: 0,
            timeline: '30-45 days (payment terms)',
            effort: 'Low',
            recommended: false,
            breakdown: [
                { item: `${quantity} units @ €${unitValue.toFixed(2)}`, cost: equipmentCost },
                { item: 'Administrative fee', cost: adminCost },
                { item: 'Total invoice amount', cost: totalCost }
            ],
            pros: [
                'Simple accounting entry',
                'Standard industry practice',
                'Clear liability assignment'
            ],
            cons: [
                'Cash flow impact (30-45 day payment)',
                'Does not physically recover equipment',
                'Administrative overhead'
            ]
        };
    },

    /**
     * Calculate PSP (Pallet Service Provider) option
     */
    calculatePSPOption(quantity, equipmentType, distance, isSurplus) {
        const pickupCost = this.COSTS.PSP_PICKUP_BASE + (quantity * this.COSTS.PSP_PICKUP_PER_UNIT);
        const poolingCost = quantity * this.COSTS.PSP_POOLING_MONTHLY * 3; // 3-month avg
        const unitValue = this.getUnitValue(equipmentType);
        const equipmentValue = quantity * unitValue;

        const totalCost = pickupCost + poolingCost;
        const savings = equipmentValue - totalCost;

        const isRecommended = totalCost < equipmentValue && quantity >= 20;

        return {
            id: 'psp',
            title: 'PSP Pickup & Pool Exchange',
            description: `Have PSP (e.g., CHEP, LPR, IPP Logipal) collect ${quantity} units and credit to your pool account. Units can be reboked for future transports.`,
            totalCost,
            savings: Math.max(0, savings),
            timeline: '3-7 days (pickup) + ongoing pooling',
            effort: 'Medium',
            recommended: isRecommended,
            breakdown: [
                { item: 'PSP pickup service', cost: this.COSTS.PSP_PICKUP_BASE },
                { item: `${quantity} units handling @ €${this.COSTS.PSP_PICKUP_PER_UNIT.toFixed(2)}`, cost: quantity * this.COSTS.PSP_PICKUP_PER_UNIT },
                { item: '3-month pooling fees', cost: poolingCost },
                { item: 'Total cost', cost: totalCost },
                { item: '─────────────', cost: null },
                { item: 'Equipment value recovered', cost: equipmentValue },
                { item: 'Net savings', cost: savings }
            ],
            pros: [
                'Physical equipment recovered',
                `Saves €${savings.toFixed(2)} vs invoicing`,
                'Units can be reused immediately',
                'No carrier relationship impact',
                'PSP handles all logistics'
            ],
            cons: [
                'Ongoing pooling fees',
                'Requires PSP contract',
                `Upfront cost: €${pickupCost.toFixed(2)}`
            ]
        };
    },

    /**
     * Calculate carrier backhaul option
     */
    calculateBackhaulOption(quantity, equipmentType, distance, carrier, isSurplus) {
        const isFTL = this.isFTL(quantity, equipmentType);
        const surcharge = isFTL ? this.COSTS.CARRIER_SURCHARGE_FTL : this.COSTS.CARRIER_SURCHARGE_LTL;

        // Distance-based transport cost estimate
        const baseRate = distance < this.THRESHOLDS.DISTANCE_SHORT ? 0.80 :
                        distance < this.THRESHOLDS.DISTANCE_MEDIUM ? 0.65 :
                        0.55; // €/km - cheaper for longer distances

        const transportCost = distance * baseRate;
        const totalCost = transportCost + surcharge;

        const unitValue = this.getUnitValue(equipmentType);
        const equipmentValue = quantity * unitValue;
        const savings = equipmentValue - totalCost;

        const isRecommended = isFTL && savings > 100;

        return {
            id: 'backhaul',
            title: isFTL ? 'Carrier FTL Backhaul' : 'Carrier LTL Return',
            description: isFTL
                ? `Use ${carrier} to backhaul ${quantity} units (FTL) on return trip. Negotiate as part of existing transport contract.`
                : `Add ${quantity} units to ${carrier}'s next available LTL return load.`,
            totalCost,
            savings: Math.max(0, savings),
            timeline: isFTL ? '5-10 days' : '10-20 days (wait for capacity)',
            effort: 'Medium',
            recommended: isRecommended,
            breakdown: [
                { item: `${distance}km @ €${baseRate.toFixed(2)}/km`, cost: transportCost },
                { item: isFTL ? 'FTL surcharge' : 'LTL surcharge', cost: surcharge },
                { item: 'Total transport cost', cost: totalCost },
                { item: '─────────────', cost: null },
                { item: 'Equipment value recovered', cost: equipmentValue },
                { item: 'Net savings', cost: savings }
            ],
            pros: [
                isFTL ? 'Full truck load efficiency' : 'Lower cost than dedicated transport',
                'Equipment physically recovered',
                `Saves €${savings.toFixed(2)} vs replacement`,
                'Maintains carrier relationship'
            ],
            cons: [
                isFTL ? 'Requires carrier negotiation' : 'Longer wait time for capacity',
                'Dependent on carrier availability',
                'May require minimum quantity commitment'
            ]
        };
    },

    /**
     * Calculate hybrid solution
     */
    calculateHybridOption(quantity, equipmentType, distance, isSurplus) {
        // Split: PSP handles majority, invoice remainder
        const pspQuantity = Math.floor(quantity * 0.75);
        const invoiceQuantity = quantity - pspQuantity;

        const pspCost = this.COSTS.PSP_PICKUP_BASE + (pspQuantity * this.COSTS.PSP_PICKUP_PER_UNIT) +
                       (pspQuantity * this.COSTS.PSP_POOLING_MONTHLY * 3);

        const unitValue = this.getUnitValue(equipmentType);
        const invoiceCost = (invoiceQuantity * unitValue) + this.COSTS.INVOICE_ADMIN_FEE;

        const totalCost = pspCost + invoiceCost;
        const fullInvoiceCost = (quantity * unitValue) + this.COSTS.INVOICE_ADMIN_FEE;
        const savings = fullInvoiceCost - totalCost;

        return {
            id: 'hybrid',
            title: 'Hybrid PSP + Invoice Solution',
            description: `Split resolution: PSP collects ${pspQuantity} units for pooling, invoice remaining ${invoiceQuantity} units. Optimizes cost vs effort.`,
            totalCost,
            savings,
            timeline: '3-7 days (PSP) + 30 days (invoice)',
            effort: 'High',
            recommended: quantity > 80 && savings > 200,
            breakdown: [
                { item: `PSP collection (${pspQuantity} units)`, cost: pspCost },
                { item: `Invoice (${invoiceQuantity} units)`, cost: invoiceCost },
                { item: 'Total cost', cost: totalCost },
                { item: '─────────────', cost: null },
                { item: 'Full invoice alternative', cost: fullInvoiceCost },
                { item: 'Net savings', cost: savings }
            ],
            pros: [
                `Recovers ${Math.round(pspQuantity/quantity*100)}% of equipment physically`,
                `Saves €${savings.toFixed(2)} vs full invoice`,
                'Balances cost and complexity',
                'Reduces cash flow impact'
            ],
            cons: [
                'Most complex option',
                'Requires coordination of two processes',
                'Higher administrative effort'
            ]
        };
    },

    // Helper functions

    getUnitValue(equipmentType) {
        const typeMap = {
            'EUR': this.COSTS.EUR_PALLET_VALUE,
            'H1': this.COSTS.H1_PALLET_VALUE,
            'CAGE': this.COSTS.CAGE_VALUE,
            'IBC': this.COSTS.IBC_VALUE,
            'DOLLY': this.COSTS.EUR_PALLET_VALUE
        };
        return typeMap[equipmentType] || this.COSTS.EUR_PALLET_VALUE;
    },

    isFTL(quantity, equipmentType) {
        const thresholds = {
            'EUR': this.THRESHOLDS.FTL_EURO_PALLETS,
            'H1': this.THRESHOLDS.FTL_EURO_PALLETS,
            'CAGE': this.THRESHOLDS.FTL_CAGES,
            'IBC': this.THRESHOLDS.FTL_IBC,
            'DOLLY': this.THRESHOLDS.FTL_EURO_PALLETS
        };
        const threshold = thresholds[equipmentType] || this.THRESHOLDS.FTL_EURO_PALLETS;
        return quantity >= threshold;
    },

    isNearFTL(quantity, equipmentType) {
        const thresholds = {
            'EUR': this.THRESHOLDS.FTL_EURO_PALLETS,
            'H1': this.THRESHOLDS.FTL_EURO_PALLETS,
            'CAGE': this.THRESHOLDS.FTL_CAGES,
            'IBC': this.THRESHOLDS.FTL_IBC,
            'DOLLY': this.THRESHOLDS.FTL_EURO_PALLETS
        };
        const threshold = thresholds[equipmentType] || this.THRESHOLDS.FTL_EURO_PALLETS;
        return quantity >= threshold * 0.75; // 75% of FTL
    },

    getDistanceCategory(distance) {
        if (distance < this.THRESHOLDS.DISTANCE_SHORT) return 'short';
        if (distance < this.THRESHOLDS.DISTANCE_MEDIUM) return 'medium';
        if (distance < this.THRESHOLDS.DISTANCE_LONG) return 'long';
        return 'very-long';
    },

    getSeverity(quantity, financialImpact) {
        if (financialImpact < 100) return 'low';
        if (financialImpact < 500) return 'medium';
        if (financialImpact < 1500) return 'high';
        return 'critical';
    }
};

// Export for use in main application
if (typeof window !== 'undefined') {
    window.ReconciliationEngine = ReconciliationEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReconciliationEngine;
}
