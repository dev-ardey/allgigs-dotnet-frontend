"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from "../SupabaseClient";
import CompleteProfileForm from "../components/ui/CompleteProfileForm";
// import { useProfileCheck } from "../components/ui/useProfileCheck";
import {
    Search,
    Info,
    BarChart3,
    ChartPie,
    MousePointerClick,
    Plus,
} from 'lucide-react';

// Automation Details Interface
interface AutomationDetails {
    id: number;
    Company_name: string;
    Task_ID?: string;
    "Parent company"?: string;
    "Has permanent partner"?: boolean;
    "does not work with allgigs?"?: boolean;
    API?: string;
    URL?: string;
    "paid/free"?: string;
    payment?: string;
    "pay to access"?: string;
    "Pay to reply"?: string;
    subscription?: string;
    "subscription price/ month"?: number;
    "transaction fees"?: number;
    "transaction %"?: number;
    percentage?: number;
    "percentage fee"?: number;
    "Hourly rate"?: number;
    "Fixed price"?: number;
    "paid by employer"?: boolean;
    "Company description"?: string;
    government?: boolean;
    "private company"?: boolean;
    "semi government"?: boolean;
    "job board"?: boolean;
    "recruitment company"?: boolean;
    "recruitment tech"?: boolean;
    broker?: boolean;
    "procurement tool"?: boolean;
    "End customer"?: boolean | string;
    "Dutch Only"?: boolean;
    "Pricing info found?"?: boolean | string;
}

// Job Data Interface
// interface JobData {
//     id: number;
//     industry?: string;
//     source?: string;
//     company_name?: string;
//     title?: string;
//     location?: string;
//     created_at?: string;
// }

// Industry Stats Interface
interface IndustryStats {
    industry: string;
    count: number;
    percentage: number;
}

// Source Job Stats Interface
interface SourceJobStats {
    [source: string]: {
        [industry: string]: number;
        total: number;
    };
}

// Company Card Component
const CompanyCard: React.FC<{
    cardStyling: any;
    company: AutomationDetails;
    onClick: () => void;
    isSelected: boolean;
    onSelectionChange: (companyId: number, selected: boolean) => void;
    sourceJobStats: SourceJobStats;
    getIndustryColor: (industry: string) => string;
}> = ({ company, onClick, isSelected, onSelectionChange, sourceJobStats, getIndustryColor, cardStyling }) => {
    const capitalizeFirstLetter = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Get job data for this source
    console.log(`Looking for job data for company: "${company.Company_name}"`);
    const sourceData = sourceJobStats[company.Company_name] || { total: 0 };
    const sourceIndustries = Object.entries(sourceData).filter(([key]) => key !== 'total');
    const sourceTotal = sourceData.total;
    console.log(`Found ${sourceTotal} jobs for ${company.Company_name}:`, sourceData);


    return (
        <div
            className="company-card" style={cardStyling}>
            {/* Company Name */}
            <div className="company-name-container">
                <div className="company-name-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                        <h3 className="company-name">
                            {capitalizeFirstLetter(company.Company_name)}
                            {(() => {
                                const frenchSources = ['404Works', 'comet', 'Welcome to the Jungle', 'Freelance-Informatique', 'Codeur.com'];
                                const isFrench = frenchSources.includes(company.Company_name);
                                return isFrench ? ' 🇫🇷' : '';
                            })()}
                        </h3>
                        <div className="company-subtitle">
                            <span className="subtitle-label">Pricing info:</span>
                            <span className="subtitle-value">
                                {company["Pricing info found?"] === true || company["Pricing info found?"] === 'yes' || company["Pricing info found?"] === 'Yes' ? 'Yes' :
                                    company["Pricing info found?"] === false || company["Pricing info found?"] === 'no' || company["Pricing info found?"] === 'No' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            No
                                            <div className="info-tooltip-container">
                                                <Info size={14} className="info-icon" />
                                                <div className="info-tooltip">
                                                    We could not find any information regarding the pricing, we therefore guess based on experience. The information might be wrong.
                                                </div>
                                            </div>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {company["Pricing info found?"] ? company["Pricing info found?"].toString() : 'Not specified'}
                                            <div className="info-tooltip-container">
                                                <Info size={14} className="info-icon" />
                                                <div className="info-tooltip">
                                                    We could not find any information regarding the pricing, we therefore guess based on experience. The information might be wrong.
                                                </div>
                                            </div>
                                        </span>
                                    )}
                            </span>
                        </div>
                    </div>

                    {/* Mini Pie Chart next to title */}
                    {sourceTotal > 0 && (
                        <div className="mini-pie-container" style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: '10px', color: 'white', marginBottom: '4px', textAlign: 'center' }}>
                                {sourceTotal.toLocaleString()} jobs
                            </div>
                            <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: 'block' }}>
                                {(() => {
                                    let currentAngle = 0;

                                    return sourceIndustries.map(([industry, count]) => {
                                        const percentage = (count / sourceTotal) * 100;
                                        const sliceAngle = (percentage / 100) * 2 * Math.PI;
                                        const startAngle = currentAngle;
                                        const endAngle = currentAngle + sliceAngle;

                                        const startX = 30 + 22 * Math.cos(startAngle - Math.PI / 2);
                                        const startY = 30 + 22 * Math.sin(startAngle - Math.PI / 2);
                                        const endX = 30 + 22 * Math.cos(endAngle - Math.PI / 2);
                                        const endY = 30 + 22 * Math.sin(endAngle - Math.PI / 2);

                                        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                                        const pathData = [
                                            `M 30 30`,
                                            `L ${startX} ${startY}`,
                                            `A 22 22 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                            `Z`
                                        ].join(' ');

                                        currentAngle += sliceAngle;

                                        return (
                                            <path
                                                key={industry}
                                                d={pathData}
                                                fill={getIndustryColor(industry)}
                                                stroke="#fff"
                                                strokeWidth="1"
                                                style={{ cursor: 'pointer' }}
                                                onMouseEnter={() => {
                                                    const tooltip = document.createElement('div');
                                                    tooltip.id = 'mini-pie-tooltip';
                                                    tooltip.style.cssText = `
                                                        position: absolute;
                                                        background: #1f2937;
                                                        color: white;
                                                        padding: 6px 8px;
                                                        border-radius: 4px;
                                                        font-size: 10px;
                                                        pointer-events: none;
                                                        z-index: 1000;
                                                    `;
                                                    // Add French flag for specific sources
                                                    const frenchSources = ['404Works', 'comet', 'Welcome to the Jungle', 'Freelance-Informatique', 'Codeur.com'];
                                                    const isFrench = frenchSources.includes(company.Company_name);
                                                    const companyDisplayName = `${company.Company_name}${isFrench ? ' 🇫🇷' : ''}`;

                                                    tooltip.textContent = `${companyDisplayName} - ${industry}: ${count} jobs`;
                                                    document.body.appendChild(tooltip);
                                                }}
                                                onMouseMove={(e) => {
                                                    const tooltip = document.getElementById('mini-pie-tooltip');
                                                    if (tooltip) {
                                                        tooltip.style.left = (e.pageX + 10) + 'px';
                                                        tooltip.style.top = (e.pageY - 10) + 'px';
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    const tooltip = document.getElementById('mini-pie-tooltip');
                                                    if (tooltip) {
                                                        tooltip.remove();
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                        </div>
                    )}
                </div>
            </div>



            {/* Company Description */}
            {company["Company description"] && (
                <div className="company-description-section">
                    <div className="description-label">Description</div>
                    <div className={`company-description ${!isDescriptionExpanded ? 'description-truncated' : ''}`}>
                        {company["Company description"]}
                    </div>
                    <button
                        className="expand-description-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                    >
                        {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </button>
                </div>
            )}

            {/* Payment Information */}
            <div className="company-charges">
                <div className="charges-title">Payment Information:</div>
                <div className="charges-list">
                    {company["Pay to reply"] && (
                        <div className="charge-item">
                            <span className="charge-label">Pay to Reply:</span>
                            <span className="charge-value">{company["Pay to reply"]}</span>
                        </div>
                    )}
                    {company["pay to access"] && (
                        <div className="charge-item">
                            <span className="charge-label">Pay to Access:</span>
                            <span className="charge-value">{company["pay to access"]}</span>
                        </div>
                    )}
                    <div className="charge-item">
                        <span className="charge-label">Paid/Free:</span>
                        <span className="charge-value">{company["paid/free"] || "Not specified"}</span>
                    </div>
                </div>
            </div>

            {/* Company Charges */}
            <div className="company-charges">
                <div className="charges-title">Cost:</div>
                <div className="charges-list">
                    {(() => {
                        const hasSubscriptionFee = company["subscription price/ month"] !== undefined && company["subscription price/ month"] !== null && company["subscription price/ month"] > 0;
                        const hasTransactionFee = typeof company["transaction fees"] === 'number' && company["transaction fees"] > 0;
                        const hasTransactionPercent = company["transaction %"] !== undefined && company["transaction %"] !== null && company["transaction %"] > 0;
                        const hasPercentageFee = company["percentage fee"] !== undefined && company["percentage fee"] !== null && company["percentage fee"] > 0;
                        const hasHourlyRate = company["Hourly rate"] !== undefined && company["Hourly rate"] !== null && company["Hourly rate"] > 0;

                        const hasAnyCosts = hasSubscriptionFee || hasTransactionFee || hasTransactionPercent || hasPercentageFee || hasHourlyRate;

                        if (!hasAnyCosts) {
                            return (
                                <div className="charge-item">
                                    <span className="charge-value">Free</span>
                                </div>
                            );
                        }

                        return (
                            <>
                                {hasSubscriptionFee && (
                                    <div className="charge-item">
                                        <span className="charge-label">Subscription fees:</span>
                                        <span className="charge-value">€{company["subscription price/ month"]}/month</span>
                                    </div>
                                )}
                                {hasTransactionFee && (
                                    <div className="charge-item">
                                        <span className="charge-label">Transaction fees:</span>
                                        <span className="charge-value">€{company["transaction fees"]}</span>
                                    </div>
                                )}
                                {hasTransactionPercent && (
                                    <div className="charge-item">
                                        <span className="charge-label">Transaction fees:</span>
                                        <span className="charge-value">{company["transaction %"]}%</span>
                                    </div>
                                )}
                                {hasPercentageFee && (
                                    <div className="charge-item">
                                        <span className="charge-label">Percentage fees:</span>
                                        <span className="charge-value">{company["percentage fee"]}%</span>
                                    </div>
                                )}
                                {hasHourlyRate && (
                                    <div className="charge-item">
                                        <span className="charge-label">Hourly rate:</span>
                                        <span className="charge-value">€{company["Hourly rate"]}/hour</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Customers Title */}
            <div className="customers-title">
                Customers
            </div>

            {/* Company Categories */}
            <div className="company-categories">
                {company["End customer"] && company["End customer"] !== "no" && (
                    <span className="category-badge category-end-customer">
                        End Customer
                    </span>
                )}
                {company["semi government"] && (
                    <span className="category-badge category-semi-gov">
                        Semi-Gov
                    </span>
                )}
                {company.government && (
                    <span className="category-badge category-government">
                        Government
                    </span>
                )}
            </div>


            {/* Visit Website Button */}
            {company.URL && (
                <div style={{ marginBottom: '8px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            let url = company.URL;
                            // Ensure URL has protocol
                            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                            }
                            window.open(url, '_blank');
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: 'rgba(139, 92, 246, 0.3)',
                            color: '#fff',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                        }}
                    >
                        <MousePointerClick size={16} />
                        Visit Website
                    </button>
                </div>
            )}

            {/*Price Analysis & Cost Button */}
            <div style={{ marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                <button
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        color: '#fff',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }}
                >
                    <BarChart3 size={16} />
                    Price & Cost Summary
                </button>
            </div>

            {/* Compare in Chart Button (replaces checkbox) */}
            <div style={{ marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                <button
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        color: '#fff',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectionChange(company.id, !isSelected);
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }}
                >
                    <Plus size={16} />
                    {isSelected ? 'Added to comparison' : 'Compare in chart'}
                </button>
            </div>

        </div>
    );
};

// Company Detail Modal Component
const CompanyDetailModal: React.FC<{
    company: AutomationDetails;
    companies: AutomationDetails[];
    onClose: () => void;
    calculatorHours: number;
    calculatorWeeksPerMonth: number;
    calculatorMonthlyTotal: number;
    calculatorTotalWithTax: number;
}> = ({ company, companies, onClose, calculatorHours, calculatorWeeksPerMonth, calculatorMonthlyTotal, calculatorTotalWithTax }) => {
    const getCompanyTypes = () => {
        const types = [];
        if (company["job board"]) types.push({ label: 'Job Board', color: 'modal-badge-job-board' });
        if (company["recruitment company"]) types.push({ label: 'Recruitment Company', color: 'modal-badge-recruitment' });
        if (company["recruitment tech"]) types.push({ label: 'Recruitment Tech', color: 'modal-badge-tech' });
        if (company.broker) types.push({ label: 'Broker', color: 'modal-badge-broker' });
        if (company["procurement tool"]) types.push({ label: 'Procurement Tool', color: 'modal-badge-procurement' });
        if (company["End customer"] !== false && company["End customer"] !== "no") types.push({ label: 'End Customer', color: 'modal-badge-customer' });
        return types;
    };

    const companyTypes = getCompanyTypes();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-body">
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">
                                {company.Company_name.charAt(0).toUpperCase() + company.Company_name.slice(1).toLowerCase()}
                            </h2>
                            {company["Parent company"] && (
                                <p className="modal-subtitle">Parent: {company["Parent company"]}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="modal-close-button"
                        >
                            ×
                        </button>
                    </div>

                    {company["Company description"] && (
                        <div className="modal-section">
                            <h3 className="modal-section-title">Description</h3>
                            <p className="company-description-modal">
                                {company["Company description"]}
                            </p>
                        </div>
                    )}

                    <div className="modal-section" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        {companyTypes.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <h3 className="modal-section-title">Business Model</h3>
                                <div className="modal-badges">
                                    {companyTypes.map((type, index) => (
                                        <span key={index} className={`modal-badge ${type.color}`}>
                                            {type.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {((company["subscription price/ month"] !== null && company["subscription price/ month"] !== undefined) || company["Hourly rate"]) && (
                            <div style={{ flex: 1 }}>
                                <h3 className="modal-section-title">Cost Analysis</h3>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div className="cost-chart">
                                        {(() => {
                                            const currentDate = new Date();
                                            const subscriptionCost = company["subscription price/ month"] || 0;
                                            const hourlyRate = company["Hourly rate"] || 0;
                                            const monthlyHourlyCost = hourlyRate * calculatorHours * calculatorWeeksPerMonth;
                                            const percentageFee = company["percentage fee"] || 0;
                                            const monthlyPercentageCost = calculatorMonthlyTotal * (percentageFee / 100);
                                            // const totalPercentageCost = calculatorTotalWithTax * (percentageFee / 100);
                                            const maxCost = Math.max(subscriptionCost, monthlyHourlyCost, monthlyPercentageCost) * 3 || 1;

                                            const subscriptionData = [1, 2, 3].map((month, index) => {
                                                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + index, 1);
                                                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                                                const cumulativeCost = subscriptionCost * month;
                                                return {
                                                    month: monthName,
                                                    cost: cumulativeCost,
                                                    x: (index / 2) * 100,
                                                    y: 100 - (cumulativeCost / maxCost) * 100
                                                };
                                            });

                                            const hourlyData = [1, 2, 3].map((month, index) => {
                                                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + index, 1);
                                                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                                                const cumulativeCost = monthlyHourlyCost * month;
                                                return {
                                                    month: monthName,
                                                    cost: cumulativeCost,
                                                    x: (index / 2) * 100,
                                                    y: 100 - (cumulativeCost / maxCost) * 100
                                                };
                                            });

                                            const percentageData = [1, 2, 3].map((month, index) => {
                                                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + index, 1);
                                                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                                                const cumulativeCost = monthlyPercentageCost * month;
                                                return {
                                                    month: monthName,
                                                    cost: cumulativeCost,
                                                    x: (index / 2) * 100,
                                                    y: 100 - (cumulativeCost / maxCost) * 100
                                                };
                                            });

                                            return (
                                                <>
                                                    <div className="cost-line-chart">
                                                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                                                            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#e5e7eb" strokeWidth="1" />
                                                            {(company["subscription price/ month"] !== null && company["subscription price/ month"] !== undefined) && subscriptionData.length >= 2 && (
                                                                <>
                                                                    <line x1={`${subscriptionData[0]?.x}%`} y1={`${subscriptionData[0]?.y}%`} x2={`${subscriptionData[1]?.x}%`} y2={`${subscriptionData[1]?.y}%`} stroke="#3b82f6" strokeWidth="3" />
                                                                    {subscriptionData.length >= 3 && (
                                                                        <line x1={`${subscriptionData[1]?.x}%`} y1={`${subscriptionData[1]?.y}%`} x2={`${subscriptionData[2]?.x}%`} y2={`${subscriptionData[2]?.y}%`} stroke="#3b82f6" strokeWidth="3" />
                                                                    )}
                                                                </>
                                                            )}
                                                            {company["Hourly rate"] !== undefined && company["Hourly rate"] !== null && hourlyData.length >= 2 && (
                                                                <>
                                                                    <line x1={`${hourlyData[0]?.x}%`} y1={`${hourlyData[0]?.y}%`} x2={`${hourlyData[1]?.x}%`} y2={`${hourlyData[1]?.y}%`} stroke="#10b981" strokeWidth="3" />
                                                                    {hourlyData.length >= 3 && (
                                                                        <line x1={`${hourlyData[1]?.x}%`} y1={`${hourlyData[1]?.y}%`} x2={`${hourlyData[2]?.x}%`} y2={`${hourlyData[2]?.y}%`} stroke="#10b981" strokeWidth="3" />
                                                                    )}
                                                                </>
                                                            )}
                                                            {company["percentage fee"] && percentageData.length >= 2 && (
                                                                <>
                                                                    <line x1={`${percentageData[0]?.x}%`} y1={`${percentageData[0]?.y}%`} x2={`${percentageData[1]?.x}%`} y2={`${percentageData[1]?.y}%`} stroke="#8b5cf6" strokeWidth="3" />
                                                                    {percentageData.length >= 3 && (
                                                                        <line x1={`${percentageData[1]?.x}%`} y1={`${percentageData[1]?.y}%`} x2={`${percentageData[2]?.x}%`} y2={`${percentageData[2]?.y}%`} stroke="#8b5cf6" strokeWidth="3" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </svg>
                                                        {(company["subscription price/ month"] !== null && company["subscription price/ month"] !== undefined) && subscriptionData.map((point, index) => (
                                                            <div key={`sub-point-${index}`}>
                                                                <div className="cost-point" style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: '#3b82f6' }} />
                                                                <div className="cost-value-labels" style={{ left: `${point.x}%`, top: `${point.y - 10}%`, transform: 'translate(-50%, -50%)', color: '#3b82f6' }}>
                                                                    {point.cost === 0 ? "€0" : `€${point.cost.toFixed(1)}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {company["Hourly rate"] !== undefined && company["Hourly rate"] !== null && hourlyData.map((point, index) => (
                                                            <div key={`hr-point-${index}`}>
                                                                <div className="cost-point" style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: '#10b981' }} />
                                                                <div className="cost-value-labels" style={{ left: `${point.x}%`, top: `${point.y - 10}%`, transform: 'translate(-50%, -50%)', color: '#10b981' }}>
                                                                    {point.cost === 0 ? "€0" : `€${point.cost.toFixed(1)}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {company["percentage fee"] !== undefined && company["percentage fee"] !== null && percentageData.map((point, index) => (
                                                            <div key={`perc-point-${index}`}>
                                                                <div className="cost-point" style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: '#8b5cf6' }} />
                                                                <div className="cost-value-labels" style={{ left: `${point.x}%`, top: `${point.y - 10}%`, transform: 'translate(-50%, -50%)', color: '#8b5cf6' }}>
                                                                    {point.cost === 0 ? "€0" : `€${point.cost.toFixed(1)}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="cost-month-labels">
                                                        {subscriptionData.map((point, index) => (
                                                            <span key={`month-${index}`}>{point.month}</span>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {(() => {
                                        const hourlyRate = company["Hourly rate"] || 0;
                                        const monthlyHourlyCost = hourlyRate * calculatorHours * calculatorWeeksPerMonth;
                                        const percentageFee = company["percentage fee"] || 0;
                                        const monthlyPercentageCost = calculatorMonthlyTotal * (percentageFee / 100);
                                        const totalPercentageCost = calculatorTotalWithTax * (percentageFee / 100);
                                        const allCompanies = companies || [];
                                        const subscriptionModelCompanies = allCompanies.filter(c =>
                                            c["subscription price/ month"] &&
                                            c["subscription price/ month"] > 0 &&
                                            c["subscription price/ month"] < 10000
                                        );
                                        const subscriptionCosts = subscriptionModelCompanies
                                            .map(c => Number(c["subscription price/ month"]))
                                            .filter((cost): cost is number => !isNaN(cost) && cost > 0);

                                        const averageSubscription = subscriptionCosts.length > 0
                                            ? subscriptionCosts.reduce((sum: number, cost: number) => sum + cost, 0) / subscriptionCosts.length
                                            : 0;

                                        const currentSubscription = company["subscription price/ month"] || 0;
                                        const percentageOfAverage = averageSubscription > 0
                                            ? (currentSubscription / averageSubscription) * 100
                                            : 0;

                                        let ratioColor = "#6b7280";

                                        if (percentageOfAverage > 150) {
                                            ratioColor = "#dc2626";
                                        } else if (percentageOfAverage > 120) {
                                            ratioColor = "#ea580c";
                                        } else if (percentageOfAverage > 80) {
                                            ratioColor = "#6b7280";
                                        } else if (percentageOfAverage > 50) {
                                            ratioColor = "#059669";
                                        } else {
                                            ratioColor = "#059669";
                                        }

                                        return (
                                            <div className="cost-summary-box">
                                                <h4 className="cost-summary-title">Price Analysis & Cost Summary</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {company["subscription price/ month"] ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                                                <span style={{ color: '#6b7280' }}>Subscription Average:</span>
                                                                <span style={{ color: '#374151', fontWeight: '600' }}>{averageSubscription === 0 ? "No data" : `€${averageSubscription.toFixed(1)}/month`}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                                                <span style={{ color: '#6b7280' }}>This Company:</span>
                                                                <span style={{ color: '#374151', fontWeight: '600' }}>{currentSubscription === 0 ? "Free" : `€${(currentSubscription || 0).toFixed(1)}/month`}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                                                <span style={{ color: '#6b7280' }}>Comparison:</span>
                                                                <span style={{ color: ratioColor, fontWeight: '600' }}>
                                                                    {percentageOfAverage > 100 ? 'Above Average' : percentageOfAverage < 100 ? 'Below Average' : 'Average'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div>
                                                        {(company["subscription price/ month"] !== null && company["subscription price/ month"] !== undefined) && (
                                                            <div className="cost-summary-item">
                                                                <span className="cost-summary-label">Monthly:</span>
                                                                <span className="cost-summary-value">{company["subscription price/ month"] === 0 ? "Free" : `€${(company["subscription price/ month"] || 0).toFixed(1)}`}</span>
                                                            </div>
                                                        )}
                                                        {company["Hourly rate"] !== undefined && company["Hourly rate"] !== null && (
                                                            <>
                                                                <div className="cost-summary-item">
                                                                    <span className="cost-summary-label">Hourly Rate:</span>
                                                                    <span className="cost-summary-value">{company["Hourly rate"] === 0 ? "Not specified" : `€${(company["Hourly rate"] || 0).toFixed(1)}/hour`}</span>
                                                                </div>
                                                                <div className="cost-summary-item">
                                                                    <span className="cost-summary-label">Monthly Cost:</span>
                                                                    <span className="cost-summary-value">{monthlyHourlyCost === 0 ? "No cost" : `€${monthlyHourlyCost.toFixed(1)}`}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {company["percentage fee"] !== undefined && company["percentage fee"] !== null && (
                                                            <>
                                                                <div className="cost-summary-item">
                                                                    <span className="cost-summary-label">Percentage fees:</span>
                                                                    <span className="cost-summary-value">{company["percentage fee"] === 0 ? "No fee" : `${company["percentage fee"]}%`}</span>
                                                                </div>
                                                                <div className="cost-summary-item">
                                                                    <span className="cost-summary-label">Monthly Cost:</span>
                                                                    <span className="cost-summary-value">{monthlyPercentageCost === 0 ? "No cost" : `€${monthlyPercentageCost.toFixed(1)}`}</span>
                                                                </div>
                                                                <div className="cost-summary-item">
                                                                    <span className="cost-summary-label">Total Cost:</span>
                                                                    <span className="cost-summary-value">{totalPercentageCost === 0 ? "No cost" : `€${totalPercentageCost.toFixed(1)}`}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 32px',
                                background: 'rgba(139, 92, 246, 0.3)',
                                color: '#fff',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};



// Search Bar Component
const SearchBar: React.FC<{
    value: string;
    onChange: (value: string) => void;
}> = ({ value, onChange }) => (
    <div className="search-container">
        <Search className="search-icon" />
        <input
            type="text"
            placeholder="Search companies..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="search-input"
        />
    </div>
);

// Main Component
export default function AutomationCompanies() {
    const [companies, setCompanies] = useState<AutomationDetails[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<AutomationDetails[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modelFilter, setModelFilter] = useState<string>('all');
    const [customerFilter, setCustomerFilter] = useState<string>('all');
    const [pricingModelFilter, setPricingModelFilter] = useState<string>('all');
    const [whoPaysFilter, setWhoPaysFilter] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<AutomationDetails | null>(null);
    const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    console.log('user', user);
    // Temporarily disable profile check to focus on main app functionality
    const needsProfile = false;
    const profileLoading = false;
    // const { needsProfile, loading: profileLoading } = useProfileCheck(user);

    // Job statistics state
    const [jobStats, setJobStats] = useState<IndustryStats[]>([]);
    const [sourceJobStats, setSourceJobStats] = useState<SourceJobStats>({});
    const [totalJobs, setTotalJobs] = useState<number>(0);

    // Interactive pie chart state
    const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
    const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
    const [availableSources, setAvailableSources] = useState<string[]>([]);

    // Dropdown state
    const [sourceDropdownOpen, setSourceDropdownOpen] = useState<boolean>(false);
    const [industryDropdownOpen, setIndustryDropdownOpen] = useState<boolean>(false);

    // View toggle state
    const [showingSourceBreakdown, setShowingSourceBreakdown] = useState<boolean>(false);

    // Calculator state
    const [rate, setRate] = useState<number | ''>(75);
    const [hours, setHours] = useState<number | ''>(32);
    const [weeksPerMonth, setWeeksPerMonth] = useState<number | ''>(4);
    const [months, setMonths] = useState<number | ''>(3);
    const [tax, setTax] = useState<number>(21);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [monthlySubtotal, setMonthlySubtotal] = useState<number>(0);
    const [monthlyTaxAmount, setMonthlyTaxAmount] = useState<number>(0);
    const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
    const [totalWithTax, setTotalWithTax] = useState<number>(0);

    // Calculate totals when inputs change
    useEffect(() => {
        const rateNum = typeof rate === 'number' ? rate : 0;
        const hoursNum = typeof hours === 'number' ? hours : 0;
        const weeksPerMonthNum = typeof weeksPerMonth === 'number' ? weeksPerMonth : 0;
        const monthsNum = typeof months === 'number' ? months : 0;
        const taxNum = tax || 0;

        const subtotalCalc = rateNum * hoursNum * weeksPerMonthNum * monthsNum;
        const taxAmountCalc = subtotalCalc * (taxNum / 100);
        const totalCalc = subtotalCalc + taxAmountCalc;

        const monthlySubtotalCalc = rateNum * hoursNum * weeksPerMonthNum;
        const monthlyTaxAmountCalc = monthlySubtotalCalc * (taxNum / 100);

        setSubtotal(subtotalCalc);
        setTaxAmount(taxAmountCalc);
        setTotal(totalCalc);
        setMonthlySubtotal(monthlySubtotalCalc);
        setMonthlyTaxAmount(monthlyTaxAmountCalc);
        setMonthlyTotal(monthlySubtotalCalc + monthlyTaxAmountCalc);
        setTotalWithTax(totalCalc);
    }, [rate, hours, weeksPerMonth, months, tax]);

    // Calculate costs for selected companies
    const calculateSelectedCompanyCosts = () => {
        const selectedCompanyData = companies.filter(company => selectedCompanies.has(company.id));

        const costs = {
            subscription: { monthly: 0, quarterly: 0 },
            percentage: { monthly: 0, quarterly: 0 },
            transaction: { monthly: 0, quarterly: 0 },
            hourly: { monthly: 0, quarterly: 0 },
            fixed: { monthly: 0, quarterly: 0 },
            total: { monthly: 0, quarterly: 0 }
        };

        selectedCompanyData.forEach(company => {
            // Subscription costs
            if (company["subscription price/ month"] && company["subscription price/ month"] > 0) {
                costs.subscription.monthly += company["subscription price/ month"];
                costs.subscription.quarterly += company["subscription price/ month"] * 3;
            }

            // Percentage fees (calculated on monthly and quarterly totals)
            if (company["percentage fee"] && company["percentage fee"] > 0) {
                const percentageRate = company["percentage fee"] / 100;
                costs.percentage.monthly += monthlyTotal * percentageRate;
                costs.percentage.quarterly += total * percentageRate;
            }

            // Transaction fees
            if (company["transaction fees"] && company["transaction fees"] > 0) {
                costs.transaction.monthly += company["transaction fees"];
                costs.transaction.quarterly += company["transaction fees"] * 3;
            }

            // Transaction percentage
            if (company["transaction %"] && company["transaction %"] > 0) {
                const transactionRate = company["transaction %"] / 100;
                costs.transaction.monthly += monthlyTotal * transactionRate;
                costs.transaction.quarterly += total * transactionRate;
            }

            // Hourly rates
            if (company["Hourly rate"] && company["Hourly rate"] > 0) {
                const hourlyCost = (typeof hours === 'number' ? hours : 32) * (typeof weeksPerMonth === 'number' ? weeksPerMonth : 4) * company["Hourly rate"];
                costs.hourly.monthly += hourlyCost;
                costs.hourly.quarterly += hourlyCost * 3;
            }

            // Fixed prices
            if (company["Fixed price"] && company["Fixed price"] > 0) {
                costs.fixed.monthly += company["Fixed price"];
                costs.fixed.quarterly += company["Fixed price"] * 3;
            }
        });

        // Calculate totals
        costs.total.monthly = costs.subscription.monthly + costs.percentage.monthly + costs.transaction.monthly + costs.hourly.monthly + costs.fixed.monthly;
        costs.total.quarterly = costs.subscription.quarterly + costs.percentage.quarterly + costs.transaction.quarterly + costs.hourly.quarterly + costs.fixed.quarterly;

        return costs;
    };

    const selectedCompanyCosts = calculateSelectedCompanyCosts();
    console.log('selectedCompanyCosts', selectedCompanyCosts);

    // Calculate source breakdown for selected industries
    const getSourceBreakdownForIndustries = (industries: Set<string>) => {
        const sourceBreakdown: { source: string; count: number; percentage: number }[] = [];
        let totalForIndustries = 0;

        // Count jobs in selected industries across filtered sources
        Object.entries(sourceJobStats).forEach(([source, data]) => {
            if (selectedSources.has(source)) {
                let sourceCount = 0;
                industries.forEach(industry => {
                    if (data[industry]) {
                        sourceCount += data[industry];
                    }
                });
                if (sourceCount > 0) {
                    sourceBreakdown.push({ source, count: sourceCount, percentage: 0 });
                    totalForIndustries += sourceCount;
                }
            }
        });

        // Calculate percentages
        sourceBreakdown.forEach(item => {
            item.percentage = totalForIndustries > 0 ? (item.count / totalForIndustries) * 100 : 0;
        });

        return { breakdown: sourceBreakdown.sort((a, b) => b.count - a.count), total: totalForIndustries };
    };

    // Consistent color mapping for industries (shared across all pie charts)
    const getIndustryColor = (industry: string) => {
        console.log('Getting color for industry:', `"${industry}"`);

        const colorMap: { [key: string]: string } = {
            'IT': '#0066CC',           // Strong Blue
            'Creative': '#CC0000',     // Strong Red
            'Healthcare': '#009900',   // Strong Green
            'Other': '#FF9900',        // Strong Orange
            'Marketing': '#9900CC',    // Strong Purple
            'Finance': '#CC6600',      // Brown-Orange
            'Education': '#006699',    // Teal Blue
            'Engineering': '#990000',  // Dark Red
            'Sales': '#00CC66',        // Emerald Green
            'Design': '#FF6600',       // Bright Orange
            'Legal': '#663399',        // Deep Purple
            'HR': '#CC9900',           // Golden Yellow
            'Consulting': '#009966',   // Forest Green
            'Manufacturing': '#8B4513', // Saddle Brown
            'Retail': '#CC3366',       // Rose Red
            'Construction': '#666666', // Dark Gray
            'Transportation': '#3366CC', // Medium Blue
            'Real Estate': '#99CC00',  // Yellow Green
            'Media': '#FF3399',        // Hot Pink
            'Government': '#336699',   // Steel Blue
            'Non-profit': '#CC6699'    // Mauve
        };

        console.log('Available color keys:', Object.keys(colorMap));

        // If industry exists in map, use that color, otherwise generate consistent color based on hash
        if (colorMap[industry]) {
            console.log(`Using mapped color for ${industry}:`, colorMap[industry]);
            return colorMap[industry];
        } else {
            console.log(`No mapped color found for "${industry}", using hash-based color`);
        }

        // Generate consistent color based on industry name hash
        let hash = 0;
        for (let i = 0; i < industry.length; i++) {
            hash = industry.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#fbbf24', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ea580c', '#be185d', '#4f46e5', '#0d9488'];
        return colors[Math.abs(hash) % colors.length];
    };

    // Fetch job statistics
    const fetchJobStats = async () => {
        try {
            console.log('=== STARTING JOB STATS FETCH ===');
            console.log('Supabase client:', supabase);

            // First, let's test if we can connect to Supabase at all
            console.log('Testing basic Supabase connection...');
            const { data: testData, error: testError } = await supabase
                .from('automation_details')
                .select('Company_name')
                .limit(1);

            console.log('=== CONNECTION TEST ===');
            console.log('Test data:', testData);
            console.log('Test error:', testError);

            if (testError) {
                console.error('Basic connection failed:', testError);
                return;
            }

            // Test permissions on the job table specifically
            console.log('=== TESTING JOB TABLE PERMISSIONS ===');
            const { data: permTest, error: permError, count } = await supabase
                .from('Allgigs_All_vacancies_NEW')
                .select('*', { count: 'exact' })
                .limit(1);

            console.log('Permission test result:');
            console.log('- Data:', permTest);
            console.log('- Error:', permError);
            console.log('- Count:', count);
            console.log('- Error details:', permError?.details);
            console.log('- Error hint:', permError?.hint);
            console.log('- Error code:', permError?.code);

            if (permError) {
                console.error('PERMISSION ERROR on Allgigs_All_vacancies_NEW:', permError);
                console.error('This suggests the table exists but your API key doesn\'t have read access');
                return;
            }

            if (count === 0) {
                console.warn('Table exists and is accessible, but contains 0 records');
                console.warn('Please check if data has been imported into Allgigs_All_vacancies_NEW');
                return;
            }

            console.log(`Found ${count} records in table!`);

            // If we have data, let's also check what columns are available
            if (permTest && permTest.length > 0) {
                console.log('Sample record from table:', permTest[0]);
                console.log('Available columns:', Object.keys(permTest[0]));
            }

            console.log('Connection successful! Now trying job stats table...');

            // Let's check what tables are available by trying some common variations
            const tableVariations = [
                'Allgigs_All_vacancies_NEW',
                'allgigs_all_vacancies_new',
                'Allgigs_All_vacancies',
                'allgigs_all_vacancies',
                'job_data',
                'jobs',
                'vacancies'
            ];

            // let foundData = null;
            let workingTable = null;

            for (const tableName of tableVariations) {
                try {
                    console.log(`Trying table: ${tableName}`);
                    const { data: testData, error: testError, count } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact' })
                        .limit(1);

                    console.log(`Table ${tableName}: data=${testData?.length || 0}, error=${testError?.message || 'none'}, count=${count}`);

                    if (!testError && testData && testData.length > 0) {
                        console.log(`Found data in table: ${tableName}`);
                        console.log('Sample record:', testData[0]);
                        console.log('Available columns:', Object.keys(testData[0]));
                        workingTable = tableName;
                        break;
                    }
                } catch (err) {
                    console.log(`Table ${tableName} failed:`, err);
                }
            }

            if (!workingTable) {
                console.error('No job data tables found with data');
                return;
            }

            console.log(`Using table: ${workingTable}`);
            console.log('Fetching from table:', workingTable);

            // Try the main table
            console.log('Attempting query...');
            const { data, error } = await supabase
                .from(workingTable)
                .select('Industry, Source');

            console.log('=== QUERY RESULT ===');
            console.log('Data:', data);
            console.log('Error:', error);
            console.log('Data length:', data?.length);

            console.log('Job stats data:', data, 'Error:', error);

            if (error) {
                console.error('Supabase error:', error);

                // Try with different column names
                const columnVariations = [
                    ['Industry', 'Source'],
                    ['industry', 'source'],
                    ['INDUSTRY', 'SOURCE'],
                    ['Industy', 'Source']
                ];

                for (const [industryCol, sourceCol] of columnVariations) {
                    try {
                        console.log(`Trying columns: ${industryCol}, ${sourceCol}`);
                        const { data: testData, error: testError } = await supabase
                            .from('Allgigs_All_vacancies_NEW')
                            .select(`${industryCol}, ${sourceCol}`)
                            .limit(5);

                        if (!testError && testData && testData.length > 0) {
                            console.log(`Found data with columns ${industryCol}, ${sourceCol}:`, testData[0]);
                            // Update the data processing to use these columns
                            break;
                        }
                    } catch (e) {
                        console.log(`Columns ${industryCol}, ${sourceCol} not found`);
                    }
                }
                return;
            }

            if (!data || data.length === 0) {
                console.log('No data found in Allgigs_All_vacancies_NEW');
                return;
            }

            const industryCounts: { [key: string]: number } = {};
            const sourceCounts: SourceJobStats = {};
            let total = 0;

            data.forEach(job => {
                const industry = job.Industry || 'Unknown';
                let source = job.Source || 'Unknown';

                // Merge LinkedIn sources into one
                if (source.toLowerCase().includes('linkedin') ||
                    source.toLowerCase().includes('linkedininterim') ||
                    source.toLowerCase().includes('linkedinzzp') ||
                    source.toLowerCase().includes('linked')) {
                    source = 'LinkedIn';
                }

                // Count by industry
                industryCounts[industry] = (industryCounts[industry] || 0) + 1;
                total++;

                // Count by source and industry
                if (!sourceCounts[source]) {
                    sourceCounts[source] = { total: 0 };
                }
                sourceCounts[source][industry] = (sourceCounts[source][industry] || 0) + 1;
                sourceCounts[source].total++;
            });

            // Convert to array and calculate percentages
            const industryStats: IndustryStats[] = Object.entries(industryCounts)
                .map(([industry, count]) => ({
                    industry,
                    count,
                    percentage: total > 0 ? (count / total) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count);

            console.log('Processed job stats:', { industryStats, sourceCounts, total });
            console.log('Industry counts breakdown:', industryCounts);
            console.log('Number of unique industries:', Object.keys(industryCounts).length);
            console.log('Industry names:', Object.keys(industryCounts));
            console.log('Available source names in job data:', Object.keys(sourceCounts));
            setJobStats(industryStats);
            setSourceJobStats(sourceCounts);
            setTotalJobs(total);

            // Set available sources and select all by default
            const sources = Object.keys(sourceCounts);
            setAvailableSources(sources);
            setSelectedSources(new Set(sources));

            // Set all industries as selected by default
            setSelectedIndustries(new Set(industryStats.map(stat => stat.industry)));
        } catch (err) {
            console.error('Error fetching job stats:', err);
        }
    };

    const fetchCompanies = async () => {
        try {
            console.log('=== STARTING COMPANIES FETCH ===');
            setLoading(true);
            const { data, error } = await supabase
                .from('automation_details')
                .select('*')
                .order('Company_name');

            console.log('=== COMPANIES QUERY RESULT ===');
            console.log('Companies data:', data);
            console.log('Companies error:', error);
            console.log('Companies count:', data?.length);

            if (error) {
                throw error;
            }

            // Merge LinkedIn companies into one
            const mergedCompanies = [];
            const linkedInCompanies: any[] = [];
            const otherCompanies: any[] = [];

            (data || []).forEach(company => {
                const companyName = company.Company_name?.toLowerCase() || '';
                if (companyName.includes('linkedin') ||
                    companyName.includes('linkedininterim') ||
                    companyName.includes('linkedinzzp') ||
                    companyName.includes('linked')) {
                    linkedInCompanies.push(company);
                } else {
                    otherCompanies.push(company);
                }
            });

            // If we have LinkedIn companies, merge them into one
            if (linkedInCompanies.length > 0) {
                // Use the first LinkedIn company as the base and combine data
                const mergedLinkedIn = { ...linkedInCompanies[0] };
                mergedLinkedIn.Company_name = 'LinkedIn';

                // Combine job counts from all LinkedIn variants
                let totalJobs = 0;
                linkedInCompanies.forEach(linkedInCompany => {
                    const sourceData = sourceJobStats[linkedInCompany.Company_name] || { total: 0 };
                    totalJobs += sourceData.total;
                });

                mergedCompanies.push(mergedLinkedIn);
            }

            // Add all other companies
            mergedCompanies.push(...otherCompanies);

            setCompanies(mergedCompanies);
            setFilteredCompanies(mergedCompanies);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            }
        } catch (error) {
            console.error('Error checking user:', error);
        }
    };

    useEffect(() => {
        let filtered = companies;

        if (searchTerm.trim()) {
            filtered = filtered.filter(company =>
                company.Company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (company["Company description"] && company["Company description"].toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (modelFilter !== 'all') {
            filtered = filtered.filter(company => {
                if (modelFilter === 'paid') {
                    return company["paid/free"]?.toLowerCase().includes('paid');
                } else if (modelFilter === 'free') {
                    return company["paid/free"]?.toLowerCase().includes('free');
                }
                return true;
            });
        }

        if (customerFilter !== 'all') {
            filtered = filtered.filter(company => {
                if (customerFilter === 'private') {
                    return company["private company"];
                } else if (customerFilter === 'semi-gov') {
                    return company["semi government"];
                } else if (customerFilter === 'government') {
                    return company.government;
                }
                return true;
            });
        }

        if (pricingModelFilter !== 'all') {
            filtered = filtered.filter(company => {
                if (pricingModelFilter === 'subscription') {
                    return company["subscription price/ month"] && company["subscription price/ month"] > 0;
                } else if (pricingModelFilter === 'transaction') {
                    return company["transaction %"] && company["transaction %"] > 0;
                } else if (pricingModelFilter === 'percentage') {
                    return company["percentage fee"] && company["percentage fee"] > 0;
                } else if (pricingModelFilter === 'hourly') {
                    return company["Hourly rate"] && company["Hourly rate"] > 0;
                } else if (pricingModelFilter === 'fixed') {
                    return company["Fixed price"] && company["Fixed price"] > 0;
                }
                return true;
            });
        }

        if (whoPaysFilter !== 'all') {
            filtered = filtered.filter(company => {
                if (whoPaysFilter === 'employer') {
                    return company["paid by employer"] === true;
                } else if (whoPaysFilter === 'freelancer') {
                    return company["paid by employer"] === false || company["paid by employer"] === null;
                }
                return true;
            });
        }

        setFilteredCompanies(filtered);
    }, [searchTerm, modelFilter, customerFilter, pricingModelFilter, whoPaysFilter, companies]);

    useEffect(() => {
        console.log('Component mounted, starting data fetch...');
        checkUser();
        fetchCompanies();
        fetchJobStats();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;

            // Check if click is outside source dropdown
            if (sourceDropdownOpen && !target.closest('.source-dropdown-container')) {
                setSourceDropdownOpen(false);
            }

            // Check if click is outside industry dropdown
            if (industryDropdownOpen && !target.closest('.industry-dropdown-container')) {
                setIndustryDropdownOpen(false);
            }
        };

        // Use a slight delay to ensure click events fire first
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [sourceDropdownOpen, industryDropdownOpen]);

    console.log('Render state:', { profileLoading, needsProfile, loading, companiesCount: companies.length, jobStatsCount: jobStats.length });

    if (profileLoading) {
        console.log('Showing profile loading...');
        return <div className="loading">Loading...</div>;
    }

    if (needsProfile) {
        console.log('Showing profile form...');
        return <CompleteProfileForm onComplete={() => {
            checkUser();
        }} />;
    }

    if (loading) {
        console.log('Showing companies loading...');
        return <div className="loading">Loading companies...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }
    const cardStyling = {
        backgroundColor: "rgba(34, 34, 34)",
        background: "rgba(34, 34, 34)",
        border: "2px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "1rem",
        // color: "#fff"
    };

    return (

        <div className="container">
            {/* Title Section with Icon */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem 0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <ChartPie style={{ width: '32px', height: '32px' }} />
                    allGigs job boards
                </h1>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                    Market Insights. Better Decisions.
                </p>
            </div>


            <div className="stats-section" style={cardStyling}>






                {/* <div className="calculator-left"> */}
                <div className="calculator-header">
                    <h2>Calculator</h2>
                    <div className="info-tooltip-container">
                        <Info size={14} className="info-icon" />
                        <div className="info-tooltip calculator-tooltip">
                            Some partners calculate costs based on a percentage of earnings or hours worked. To get the most accurate estimate, please enter your own calculation. We currently use a default.
                        </div>
                    </div>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                    Welcome to the central hub for understanding the Dutch freelance landscape. We've brought together over 60 job boards, from government portals to private recruiters, into one, free platform. We don't just show you jobs; we are going to give you key insights into the freelancing world, so you can make key informed decisions about your next career move.
                </p>
                <div className="calculation-inputs">
                    <div className="calc-input-group">
                        <label className="calc-label">Rate (€/hour)</label>
                        <input
                            type="number"
                            className="calc-input"
                            value={rate}
                            onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="calc-input-group">
                        <label className="calc-label">Hours per week</label>
                        <input
                            type="number"
                            className="calc-input"
                            value={hours}
                            onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="calc-input-group">
                        <label className="calc-label">Weeks per month</label>
                        <input
                            type="number"
                            className="calc-input"
                            value={weeksPerMonth}
                            onChange={(e) => setWeeksPerMonth(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="calc-input-group">
                        <label className="calc-label">Months</label>
                        <input
                            type="number"
                            className="calc-input"
                            value={months}
                            onChange={(e) => setMonths(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="calc-input-group">
                        <label className="calc-label">Tax (%)</label>
                        <input
                            type="number"
                            className="calc-input"
                            value={tax}
                            onChange={(e) => setTax(Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                </div>
                <div className="calculation-results">
                    <div className="calc-results-simple">
                        <div className="calc-monthly-section">
                            <h4>Per Month</h4>
                            <div className="calc-result-row">
                                <span>Subtotal:</span>
                                <span>€{monthlySubtotal.toFixed(1)}</span>
                            </div>
                            <div className="calc-result-row">
                                <span>Tax:</span>
                                <span>+ €{monthlyTaxAmount.toFixed(1)}</span>
                            </div>
                            <div className="calc-result-row">
                                <span>Total:</span>
                                <span>€{(monthlySubtotal + monthlyTaxAmount).toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="calc-total-section">
                            <h4>Total</h4>
                            <div className="calc-result-row">
                                <span>Subtotal:</span>
                                <span>€{subtotal.toFixed(1)}</span>
                            </div>
                            <div className="calc-result-row">
                                <span>Tax:</span>
                                <span>+ €{taxAmount.toFixed(1)}</span>
                            </div>
                            <div className="calc-result-row">
                                <span>Total:</span>
                                <span>€{total.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* </div> */}
            </div>

            <div className="calculator-section">
                <div className="calculator-split-container">

                    <div className="calculator-right">
                        <h2>Comparison</h2>

                        <p>
                            Data-Driven Decisions insights: Our data helps you sidestep the wrong opportunities and focus your valuable time when it's needed most. You'll gain a transparent view into the marketplace, which is crucial since many jobs are locked behind small portals.
                        </p>

                        {/* Industry Job Statistics */}
                        <div className="industry-stats-section" style={{ marginBottom: '20px', background: 'rgba(34, 34, 34)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: '0', color: '#c0c0c0' }}>
                                    {showingSourceBreakdown
                                        ? `Freelance market - Source`
                                        : `Freelance market - Industry`
                                    }
                                </h3>
                                <button
                                    onClick={() => {
                                        if (showingSourceBreakdown) {
                                            // Switch to industry view
                                            setShowingSourceBreakdown(false);
                                        } else {
                                            // Switch to source view (only if industries are selected)
                                            if (selectedIndustries.size > 0) {
                                                setShowingSourceBreakdown(true);
                                            }
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(139, 92, 246, 0.3)',
                                        color: '#fff',
                                        border: '1px solid rgba(139, 92, 246, 0.4)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backdropFilter: 'blur(8px)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {showingSourceBreakdown ? 'Show Industries' : 'Show Sources'}
                                </button>
                            </div>

                            {/* Source Filter Custom Dropdown */}
                            {availableSources.length > 0 && (
                                <div className="source-dropdown-container" style={{ marginBottom: '16px', position: 'relative' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#c0c0c0', fontWeight: '500' }}>
                                        Filter Sources ({selectedSources.size}/{availableSources.length} selected):
                                    </label>

                                    {/* Dropdown Button */}
                                    <div
                                        onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                            fontSize: '13px',
                                            color: '#374151',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <span>
                                            {selectedSources.size === 0
                                                ? 'Select sources...'
                                                : selectedSources.size === availableSources.length
                                                    ? 'All sources selected'
                                                    : `${selectedSources.size} sources selected`
                                            }
                                        </span>
                                        <span style={{ transform: sourceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                    </div>

                                    {/* Dropdown Options */}
                                    {sourceDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                        }}>
                                            {availableSources.map(source => {
                                                const sourceJobCount = sourceJobStats[source]?.total || 0;
                                                const isSelected = selectedSources.has(source);

                                                // Add French flag for specific sources
                                                const frenchSources = ['404Works', 'comet', 'Welcome to the Jungle', 'Freelance-Informatique', 'Codeur.com'];
                                                const isFrench = frenchSources.includes(source);

                                                return (
                                                    <div
                                                        key={source}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            const newSelected = new Set(selectedSources);
                                                            if (isSelected) {
                                                                newSelected.delete(source);
                                                            } else {
                                                                newSelected.add(source);
                                                            }
                                                            setSelectedSources(newSelected);
                                                        }}
                                                        style={{
                                                            padding: '8px 12px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                                                            borderBottom: '1px solid #f3f4f6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
                                                        }}
                                                    >
                                                        <span style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            border: '2px solid #d1d5db',
                                                            borderRadius: '3px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: isSelected ? '#3b82f6' : '#fff',
                                                            borderColor: isSelected ? '#3b82f6' : '#d1d5db',
                                                            color: '#fff',
                                                            fontSize: '10px'
                                                        }}>
                                                            {isSelected ? '✓' : ''}
                                                        </span>
                                                        <span style={{ color: '#000000' }}>
                                                            {source} ({sourceJobCount.toLocaleString()} jobs) {isFrench ? '🇫🇷' : ''}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setSelectedSources(new Set(availableSources))}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                background: 'rgba(139, 92, 246, 0.3)',
                                                color: '#fff',
                                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                backdropFilter: 'blur(8px)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedSources(new Set())}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                background: 'transparent',
                                                color: '#fff',
                                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                backdropFilter: 'blur(8px)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}

                            {jobStats.length > 0 ? (
                                <>
                                    {/* Show message when no sources selected or no industries selected */}
                                    {(showingSourceBreakdown && selectedSources.size === 0) || (!showingSourceBreakdown && selectedIndustries.size === 0) ? (
                                        <div style={{ textAlign: 'center', color: 'white', padding: '40px', marginBottom: '16px' }}>
                                            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                                                {showingSourceBreakdown ? 'No sources selected' : 'No industries selected'}
                                            </p>
                                            <p style={{ fontSize: '14px' }}>
                                                Please select at least one {showingSourceBreakdown ? 'source' : 'industry'} to view the breakdown
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="pie-chart-container" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <svg width="400" height="400" viewBox="0 0 400 400" className="pie-chart" style={{ borderRadius: '8px' }}>
                                                {(() => {
                                                    let currentAngle = 0;

                                                    // Show source breakdown or industry breakdown based on toggle
                                                    if (showingSourceBreakdown && selectedIndustries.size > 0 && selectedSources.size > 0) {
                                                        const { breakdown, total } = getSourceBreakdownForIndustries(selectedIndustries);
                                                        console.log('breakdown', breakdown, total);

                                                        return breakdown.map((item) => {
                                                            const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
                                                            const startAngle = currentAngle;
                                                            const endAngle = currentAngle + sliceAngle;

                                                            // Add French flag for specific sources
                                                            const frenchSources = ['404Works', 'comet', 'Welcome to the Jungle', 'Freelance-Informatique', 'Codeur.com'];
                                                            const isFrench = frenchSources.includes(item.source);
                                                            const displayName = `${item.source}${isFrench ? ' 🇫🇷' : ''}`;
                                                            console.log('displayName', displayName);

                                                            const startX = 200 + 150 * Math.cos(startAngle - Math.PI / 2);
                                                            const startY = 200 + 150 * Math.sin(startAngle - Math.PI / 2);
                                                            const endX = 200 + 150 * Math.cos(endAngle - Math.PI / 2);
                                                            const endY = 200 + 150 * Math.sin(endAngle - Math.PI / 2);

                                                            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                                                            const pathData = [
                                                                `M 200 200`,
                                                                `L ${startX} ${startY}`,
                                                                `A 150 150 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                                                `Z`
                                                            ].join(' ');

                                                            currentAngle += sliceAngle;

                                                            return (
                                                                <g key={item.source}>
                                                                    <path
                                                                        d={pathData}
                                                                        fill={getIndustryColor(item.source)}
                                                                        stroke="#fff"
                                                                        strokeWidth="2"
                                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                                            e.currentTarget.style.transformOrigin = '200px 200px';
                                                                            const tooltip = document.createElement('div');
                                                                            tooltip.id = 'pie-tooltip';
                                                                            tooltip.style.cssText = `
                                                                            position: absolute;
                                                                            background: #1f2937;
                                                                            color: white;
                                                                            padding: 8px 12px;
                                                                            border-radius: 6px;
                                                                            font-size: 12px;
                                                                            font-weight: 500;
                                                                            pointer-events: none;
                                                                            z-index: 1000;
                                                                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                                                        `;
                                                                            tooltip.textContent = `${item.source}: ${item.count.toLocaleString()} jobs (${item.percentage.toFixed(1)}%)`;
                                                                            document.body.appendChild(tooltip);
                                                                        }}
                                                                        onMouseMove={(e) => {
                                                                            const tooltip = document.getElementById('pie-tooltip');
                                                                            if (tooltip) {
                                                                                tooltip.style.left = (e.pageX + 10) + 'px';
                                                                                tooltip.style.top = (e.pageY - 10) + 'px';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1)';
                                                                            const tooltip = document.getElementById('pie-tooltip');
                                                                            if (tooltip) {
                                                                                tooltip.remove();
                                                                            }
                                                                        }}
                                                                    />
                                                                </g>
                                                            );
                                                        });
                                                    } else {
                                                        // Show industry breakdown - filter by selected industries AND sources
                                                        let filteredStats = selectedIndustries.size > 0
                                                            ? jobStats.filter(stat => selectedIndustries.has(stat.industry))
                                                            : jobStats;

                                                        // If sources are filtered, recalculate industry counts based on selected sources
                                                        if (selectedSources.size > 0 && selectedSources.size < availableSources.length) {
                                                            filteredStats = filteredStats.map(stat => {
                                                                // Calculate count for this industry from selected sources only
                                                                let sourceFilteredCount = 0;
                                                                selectedSources.forEach(source => {
                                                                    if (sourceJobStats[source] && sourceJobStats[source][stat.industry]) {
                                                                        sourceFilteredCount += sourceJobStats[source][stat.industry];
                                                                    }
                                                                });
                                                                return {
                                                                    ...stat,
                                                                    count: sourceFilteredCount
                                                                };
                                                            }).filter(stat => stat.count > 0); // Remove industries with 0 jobs
                                                        }

                                                        // Recalculate percentages for filtered data
                                                        const filteredTotal = filteredStats.reduce((sum, stat) => sum + stat.count, 0);
                                                        const filteredStatsWithPercentages = filteredStats.map(stat => ({
                                                            ...stat,
                                                            percentage: filteredTotal > 0 ? (stat.count / filteredTotal) * 100 : 0
                                                        }));

                                                        return filteredStatsWithPercentages.map((stat) => {
                                                            const sliceAngle = (stat.percentage / 100) * 2 * Math.PI;
                                                            const startAngle = currentAngle;
                                                            const endAngle = currentAngle + sliceAngle;

                                                            const startX = 200 + 150 * Math.cos(startAngle - Math.PI / 2);
                                                            const startY = 200 + 150 * Math.sin(startAngle - Math.PI / 2);
                                                            const endX = 200 + 150 * Math.cos(endAngle - Math.PI / 2);
                                                            const endY = 200 + 150 * Math.sin(endAngle - Math.PI / 2);

                                                            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                                                            const pathData = [
                                                                `M 200 200`,
                                                                `L ${startX} ${startY}`,
                                                                `A 150 150 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                                                `Z`
                                                            ].join(' ');

                                                            const labelAngle = startAngle + sliceAngle / 2;
                                                            console.log('labelAngle', labelAngle);
                                                            // const labelX = 200 + 200 * Math.cos(labelAngle - Math.PI / 2);
                                                            // const labelY = 200 + 200 * Math.sin(labelAngle - Math.PI / 2);

                                                            currentAngle += sliceAngle;

                                                            return (
                                                                <g key={stat.industry}>
                                                                    <path
                                                                        d={pathData}
                                                                        fill={getIndustryColor(stat.industry)}
                                                                        stroke="#fff"
                                                                        strokeWidth="2"
                                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                                            e.currentTarget.style.transformOrigin = '200px 200px';
                                                                            const tooltip = document.createElement('div');
                                                                            tooltip.id = 'pie-tooltip';
                                                                            tooltip.style.cssText = `
                                                                        position: absolute;
                                                                        background: #1f2937;
                                                                        color: white;
                                                                        padding: 8px 12px;
                                                                        border-radius: 6px;
                                                                        font-size: 12px;
                                                                        font-weight: 500;
                                                                        pointer-events: none;
                                                                        z-index: 1000;
                                                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                                                    `;
                                                                            tooltip.textContent = `${stat.industry}: ${stat.count.toLocaleString()} jobs (${stat.percentage.toFixed(1)}%)`;
                                                                            document.body.appendChild(tooltip);
                                                                        }}
                                                                        onMouseMove={(e) => {
                                                                            const tooltip = document.getElementById('pie-tooltip');
                                                                            if (tooltip) {
                                                                                tooltip.style.left = (e.pageX + 10) + 'px';
                                                                                tooltip.style.top = (e.pageY - 10) + 'px';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1)';
                                                                            const tooltip = document.getElementById('pie-tooltip');
                                                                            if (tooltip) {
                                                                                tooltip.remove();
                                                                            }
                                                                        }}
                                                                    />
                                                                </g>
                                                            );
                                                        });
                                                    }
                                                })()}
                                            </svg>
                                        </div>
                                    )}
                                    {/* Industry Filter Custom Dropdown */}
                                    <div className="industry-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#c0c0c0', fontWeight: '500' }}>
                                            Select Industries ({selectedIndustries.size}/{jobStats.length} selected):
                                        </label>

                                        {/* Dropdown Button */}
                                        <div
                                            onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                backgroundColor: '#fff',
                                                fontSize: '13px',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <span>
                                                {selectedIndustries.size === 0
                                                    ? 'Select industries...'
                                                    : selectedIndustries.size === jobStats.length
                                                        ? 'All industries selected'
                                                        : `${selectedIndustries.size} industries selected`
                                                }
                                            </span>
                                            <span style={{ transform: industryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                        </div>

                                        {/* Dropdown Options */}
                                        {industryDropdownOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                zIndex: 1000,
                                                maxHeight: '250px',
                                                overflowY: 'auto'
                                            }}>
                                                {jobStats.map((stat) => {
                                                    const isSelected = selectedIndustries.has(stat.industry);
                                                    return (
                                                        <div
                                                            key={stat.industry}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                const newSelected = new Set(selectedIndustries);
                                                                if (isSelected) {
                                                                    newSelected.delete(stat.industry);
                                                                } else {
                                                                    newSelected.add(stat.industry);
                                                                }
                                                                setSelectedIndustries(newSelected);
                                                            }}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                                                                borderBottom: '1px solid #f3f4f6',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
                                                            }}
                                                        >
                                                            <span style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                border: '2px solid #d1d5db',
                                                                borderRadius: '3px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: isSelected ? '#3b82f6' : '#fff',
                                                                borderColor: isSelected ? '#3b82f6' : '#d1d5db',
                                                                color: '#fff',
                                                                fontSize: '10px'
                                                            }}>
                                                                {isSelected ? '✓' : ''}
                                                            </span>
                                                            <span style={{ color: '#000000' }}>{stat.industry}: {stat.count.toLocaleString()} jobs ({stat.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setSelectedIndustries(new Set(jobStats.map(stat => stat.industry)))}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '11px',
                                                    background: 'rgba(139, 92, 246, 0.3)',
                                                    color: '#fff',
                                                    border: '1px solid rgba(139, 92, 246, 0.4)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    backdropFilter: 'blur(8px)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={() => setSelectedIndustries(new Set())}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '11px',
                                                    background: 'transparent',
                                                    color: '#fff',
                                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    backdropFilter: 'blur(8px)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                                    <p>Loading job statistics...</p>
                                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                                        Debug: jobStats.length = {jobStats.length}, totalJobs = {totalJobs}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="selected-companies-costs">
                            {(() => {
                                const selectedCompanyData = companies.filter(company => selectedCompanies.has(company.id));

                                if (selectedCompanyData.length === 0) {
                                    return (
                                        <div className="no-selection-message">
                                            <p>No companies selected. Select companies using the checkboxes to see their cost breakdown.</p>
                                        </div>
                                    );
                                }

                                return selectedCompanyData.map((company) => {
                                    // Calculate this company's costs
                                    let companyMonthlyCost = 0;
                                    let companyQuarterlyCost = 0;
                                    const costBreakdown = [];

                                    // Subscription costs
                                    if (company["subscription price/ month"] && company["subscription price/ month"] > 0) {
                                        companyMonthlyCost += company["subscription price/ month"];
                                        companyQuarterlyCost += company["subscription price/ month"] * 3;
                                        costBreakdown.push({
                                            label: "Subscription fees:",
                                            monthly: company["subscription price/ month"],
                                            quarterly: company["subscription price/ month"] * 3
                                        });
                                    }

                                    // Percentage fees
                                    if (company["percentage fee"] && company["percentage fee"] > 0) {
                                        const percentageRate = company["percentage fee"] / 100;
                                        const monthlyPercentageCost = monthlyTotal * percentageRate;
                                        const quarterlyPercentageCost = total * percentageRate;
                                        companyMonthlyCost += monthlyPercentageCost;
                                        companyQuarterlyCost += quarterlyPercentageCost;
                                        costBreakdown.push({
                                            label: "Percentage fees:",
                                            monthly: monthlyPercentageCost,
                                            quarterly: quarterlyPercentageCost
                                        });
                                    }

                                    // Transaction fees
                                    if (company["transaction fees"] && company["transaction fees"] > 0) {
                                        companyMonthlyCost += company["transaction fees"];
                                        companyQuarterlyCost += company["transaction fees"] * 3;
                                        costBreakdown.push({
                                            label: "Transaction fees:",
                                            monthly: company["transaction fees"],
                                            quarterly: company["transaction fees"] * 3
                                        });
                                    }

                                    // Transaction percentage
                                    if (company["transaction %"] && company["transaction %"] > 0) {
                                        const transactionRate = company["transaction %"] / 100;
                                        const monthlyTransactionCost = monthlyTotal * transactionRate;
                                        const quarterlyTransactionCost = total * transactionRate;
                                        companyMonthlyCost += monthlyTransactionCost;
                                        companyQuarterlyCost += quarterlyTransactionCost;
                                        costBreakdown.push({
                                            label: "Transaction %:",
                                            monthly: monthlyTransactionCost,
                                            quarterly: quarterlyTransactionCost
                                        });
                                    }

                                    // Hourly rates
                                    if (company["Hourly rate"] && company["Hourly rate"] > 0) {
                                        const hourlyCost = (typeof hours === 'number' ? hours : 32) * (typeof weeksPerMonth === 'number' ? weeksPerMonth : 4) * company["Hourly rate"];
                                        companyMonthlyCost += hourlyCost;
                                        companyQuarterlyCost += hourlyCost * 3;
                                        costBreakdown.push({
                                            label: "Hourly rate:",
                                            monthly: hourlyCost,
                                            quarterly: hourlyCost * 3
                                        });
                                    }

                                    // Fixed prices
                                    if (company["Fixed price"] && company["Fixed price"] > 0) {
                                        companyMonthlyCost += company["Fixed price"];
                                        companyQuarterlyCost += company["Fixed price"] * 3;
                                        costBreakdown.push({
                                            label: "Fixed price:",
                                            monthly: company["Fixed price"],
                                            quarterly: company["Fixed price"] * 3
                                        });
                                    }

                                    // If no costs, show "Free"
                                    if (costBreakdown.length === 0) {
                                        costBreakdown.push({
                                            label: "Free",
                                            monthly: 0,
                                            quarterly: 0
                                        });
                                    }

                                    return (
                                        <div key={company.id} className="company-cost-card">
                                            <div className="company-cost-header">
                                                <div className="company-cost-title-row">
                                                    <h3 className="company-cost-title">{company.Company_name}</h3>
                                                    <span className="company-cost-pricing-info">
                                                        <span className="pricing-label">Pricing info:</span>
                                                        {company["Pricing info found?"] === true || company["Pricing info found?"] === 'yes' || company["Pricing info found?"] === 'Yes' ? 'Yes' :
                                                            company["Pricing info found?"] === false || company["Pricing info found?"] === 'no' || company["Pricing info found?"] === 'No' ? (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    No
                                                                    <div className="info-tooltip-container">
                                                                        <Info size={14} className="info-icon" />
                                                                        <div className="info-tooltip">
                                                                            We could not find any information regarding the pricing, we therefore guess based on experience. The information might be wrong.
                                                                        </div>
                                                                    </div>
                                                                </span>
                                                            ) : (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    {company["Pricing info found?"] ? company["Pricing info found?"].toString() : 'Not specified'}
                                                                    <div className="info-tooltip-container">
                                                                        <Info size={14} className="info-icon" />
                                                                        <div className="info-tooltip">
                                                                            We could not find any information regarding the pricing, we therefore guess based on experience. The information might be wrong.
                                                                        </div>
                                                                    </div>
                                                                </span>
                                                            )}
                                                    </span>
                                                    <button
                                                        onClick={() => window.open(company.URL || '#', '_blank')}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(139, 92, 246, 0.3)',
                                                            color: '#fff',
                                                            border: '1px solid rgba(139, 92, 246, 0.4)',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            backdropFilter: 'blur(8px)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.5)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                                                        }}
                                                    >
                                                        Visit Website
                                                    </button>
                                                    <button
                                                        className="company-cost-remove-btn"
                                                        onClick={() => {
                                                            const newSelected = new Set(selectedCompanies);
                                                            newSelected.delete(company.id);
                                                            setSelectedCompanies(newSelected);
                                                        }}
                                                        title="Remove from selection"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="company-cost-breakdown">
                                                {costBreakdown.map((cost, index) => (
                                                    <div key={index} className="cost-item">
                                                        <span className="cost-label">{cost.label}</span>
                                                        <span className="cost-value">
                                                            €{cost.monthly.toFixed(1)}/month
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="cost-total">
                                                    <span className="cost-label">Total:</span>
                                                    <span className="cost-value">
                                                        €{companyMonthlyCost.toFixed(1)}/month | €{companyQuarterlyCost.toFixed(1)}/quarter
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-card">


                <div style={{
                    marginBottom: '24px',
                    // padding: '20px',
                    // backgroundColor: '#f8fafc',
                    // borderRadius: '12px',
                    // border: '1px solid #e2e8f0'
                }}>

                    <div className="stats-section" style={cardStyling}>

                        <p>
                            A full overview of the marketplace: Make better, more informed decisions because you have a broader view of the marketplace.
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            marginTop: '20px'
                        }}>
                            <SearchBar value={searchTerm} onChange={setSearchTerm} />
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                alignItems: 'end'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#c0c0c0'
                                    }}>Paid/Free:</label>
                                    <select
                                        value={modelFilter}
                                        onChange={(e) => setModelFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                            fontSize: '14px',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Models</option>
                                        <option value="paid">Paid</option>
                                        <option value="free">Free</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#c0c0c0'
                                    }}>Customer Type:</label>
                                    <select
                                        value={customerFilter}
                                        onChange={(e) => setCustomerFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                            fontSize: '14px',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="private">Private</option>
                                        <option value="semi-gov">Semi-Gov</option>
                                        <option value="government">Government</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#c0c0c0'
                                    }}>Pricing Model:</label>
                                    <select
                                        value={pricingModelFilter}
                                        onChange={(e) => setPricingModelFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                            fontSize: '14px',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Models</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="transaction">Transaction Fee</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="fixed">Fixed Price</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#c0c0c0'
                                    }}>Who pays:</label>
                                    <select
                                        value={whoPaysFilter}
                                        onChange={(e) => setWhoPaysFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                            fontSize: '14px',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value="employer">Employer</option>
                                        <option value="freelancer">Freelancer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="stats-subtitle">
                    {filteredCompanies.length} of {companies.length} companies
                </p>
                <hr></hr>
            </div>



            <div className="companies-grid">
                {filteredCompanies.map((company) => (
                    <CompanyCard
                        key={company.id}
                        company={company}
                        onClick={() => setSelectedCompany(company)}
                        isSelected={selectedCompanies.has(company.id)}
                        onSelectionChange={(companyId, selected) => {
                            const newSelected = new Set(selectedCompanies);
                            if (selected) {
                                newSelected.add(companyId);
                            } else {
                                newSelected.delete(companyId);
                            }
                            setSelectedCompanies(newSelected);
                        }}
                        sourceJobStats={sourceJobStats}
                        cardStyling={cardStyling}
                        getIndustryColor={getIndustryColor}
                    />
                ))}
            </div>

            {selectedCompany && (
                <CompanyDetailModal
                    company={selectedCompany}
                    companies={companies}
                    onClose={() => setSelectedCompany(null)}
                    calculatorHours={Number(hours) || 32}
                    calculatorWeeksPerMonth={Number(weeksPerMonth) || 4}
                    calculatorMonthlyTotal={monthlyTotal}
                    calculatorTotalWithTax={totalWithTax}
                />
            )}
        </div>
    );
} 
