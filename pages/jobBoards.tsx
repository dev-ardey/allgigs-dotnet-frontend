"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from "../SupabaseClient";
import CompleteProfileForm from "../components/ui/CompleteProfileForm";
import { useProfileCheck } from "../components/ui/useProfileCheck";
import { useAuth } from "../components/ui/AuthProvider";
import {
    Search,
    Info,
    Building2,
    Tag,
    DollarSign,
    Calculator,
    Globe,
    ChevronDown,
    PieChart
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
    company: AutomationDetails;
    sourceJobStats: SourceJobStats;
    getIndustryColor: (industry: string | undefined) => string;
    onClick: () => void;
    isSelected: boolean;
    onSelectionChange: (companyId: number, selected: boolean) => void;
}> = ({ company, sourceJobStats, getIndustryColor, onClick, isSelected, onSelectionChange }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const capitalizeFirstLetter = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const getCompanyType = () => {
        if (company["job board"]) return "Job Board";
        if (company["recruitment company"]) return "Recruitment";
        if (company["recruitment tech"]) return "Recruitment Tech";
        if (company.broker) return "Broker";
        if (company["procurement tool"]) return "Procurement";
        if (company["End customer"]) return "End Customer";
        return "Other";
    };

    const getCustomerType = () => {
        if (company.government) return "Government";
        if (company["semi government"]) return "Semi-Government";
        if (company["private company"]) return "Private";
        return "Mixed";
    };

    // Get job data for this source
    const sourceData = sourceJobStats[company.Company_name] || { total: 0 };
    const sourceIndustries = Object.entries(sourceData).filter(([key]) => key !== 'total');
    const sourceTotal = sourceData.total;

    return (
        <div
            onClick={onClick}
            style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
        >
            {/* Selection Checkbox - Temporarily commented out */}
            {/* <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onSelectionChange(company.id, e.target.checked);
                    }}
                    style={{
                        width: '20px',
                        height: '20px',
                        accentColor: '#9333ea',
                        cursor: 'pointer'
                    }}
                />
            </div> */}

            {/* Company Name - Large Title */}
            <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: '0 0 16px 0',
                lineHeight: '1.2'
            }}>
                {capitalizeFirstLetter(company.Company_name)}
            </h3>

            {/* Job Statistics Section */}
            {sourceTotal > 0 && (
                <div style={{
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <PieChart size={16} style={{ color: '#9333ea' }} />
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#9333ea'
                            }}>
                                Job Statistics
                            </span>
                        </div>
                        <span style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#fff'
                        }}>
                            {sourceTotal.toLocaleString()} jobs
                        </span>
                    </div>

                    {/* Mini Pie Chart */}
                    {sourceIndustries.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <svg width="60" height="60" style={{ flexShrink: 0 }}>
                                {(() => {
                                    let currentAngle = 0;
                                    return sourceIndustries.map(([industry, count]) => {
                                        const percentage = (count as number) / sourceTotal;
                                        const angle = percentage * 2 * Math.PI;
                                        const x1 = 30 + 25 * Math.cos(currentAngle);
                                        const y1 = 30 + 25 * Math.sin(currentAngle);
                                        const x2 = 30 + 25 * Math.cos(currentAngle + angle);
                                        const y2 = 30 + 25 * Math.sin(currentAngle + angle);
                                        const largeArcFlag = angle > Math.PI ? 1 : 0;

                                        const path = `M 30 30 L ${x1} ${y1} A 25 25 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                                        const color = getIndustryColor(industry);

                                        currentAngle += angle;

                                        return (
                                            <path
                                                key={industry}
                                                d={path}
                                                fill={color}
                                                stroke="#000"
                                                strokeWidth="1"
                                                style={{ cursor: 'pointer' }}
                                                onMouseEnter={() => {
                                                    const tooltip = document.createElement('div');
                                                    tooltip.id = 'mini-pie-tooltip';
                                                    tooltip.style.cssText = `
                                                        position: absolute;
                                                        background: #1f2937;
                                                        color: white;
                                                        padding: 8px 12px;
                                                        border-radius: 6px;
                                                        font-size: 12px;
                                                        pointer-events: none;
                                                        z-index: 1000;
                                                        border: 1px solid rgba(255, 255, 255, 0.1);
                                                    `;
                                                    tooltip.textContent = `${industry}: ${count} jobs (${(percentage * 100).toFixed(1)}%)`;
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

                            {/* Industry Legend */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                flex: 1
                            }}>
                                {sourceIndustries.slice(0, 3).map(([industry, count]) => (
                                    <div key={industry} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: getIndustryColor(industry)
                                        }} />
                                        <span style={{ color: '#d1d5db', flex: 1 }}>
                                            {industry}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: '600' }}>
                                            {count}
                                        </span>
                                    </div>
                                ))}
                                {sourceIndustries.length > 3 && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#9ca3af',
                                        fontStyle: 'italic'
                                    }}>
                                        +{sourceIndustries.length - 3} more industries
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Pricing Info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
            }}>
                <span style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    fontWeight: '500'
                }}>
                    Pricing info:
                </span>
                <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: company["Pricing info found?"] === true || company["Pricing info found?"] === 'yes' || company["Pricing info found?"] === 'Yes' ? '#10b981' :
                        company["Pricing info found?"] === false || company["Pricing info found?"] === 'no' || company["Pricing info found?"] === 'No' ? '#ef4444' : '#f59e0b'
                }}>
                    {company["Pricing info found?"] === true || company["Pricing info found?"] === 'yes' || company["Pricing info found?"] === 'Yes' ? 'Yes' :
                        company["Pricing info found?"] === false || company["Pricing info found?"] === 'no' || company["Pricing info found?"] === 'No' ? 'No' : 'Not specified'}
                </span>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Info size={16} style={{ color: '#6b7280', cursor: 'help' }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1f2937',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        display: 'none',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        We could not find any information regarding the pricing, we therefore guess based on experience. The information might be wrong.
                    </div>
                </div>
            </div>

            {/* Company Description */}
            {company["Company description"] && (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{
                        color: '#d1d5db',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '0',
                        display: isDescriptionExpanded ? 'block' : '-webkit-box',
                        WebkitLineClamp: isDescriptionExpanded ? 'unset' : 3,
                        WebkitBoxOrient: isDescriptionExpanded ? 'unset' : 'vertical',
                        overflow: 'hidden'
                    }}>
                        {company["Company description"]}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9333ea',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '4px 0',
                            marginTop: '8px',
                            textDecoration: 'underline'
                        }}
                    >
                        {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </button>
                </div>
            )}

            {/* Payment Information Box */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
            }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#fff',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <DollarSign size={16} style={{ color: '#9333ea' }} />
                    Payment Information
                </h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px'
                }}>
                    <div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Model:</span>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                            {company["paid/free"] || 'Not specified'}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Type:</span>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                            {company.payment || 'Not specified'}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Who Pays:</span>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                            {company["paid by employer"] === true ? 'Employer' :
                                company["paid by employer"] === false ? 'Freelancer' : 'Not specified'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Costs Box */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px'
            }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#fff',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Calculator size={16} style={{ color: '#9333ea' }} />
                    Costs
                </h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px'
                }}>
                    {company["subscription price/ month"] && company["subscription price/ month"] > 0 && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Subscription:</span>
                            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                                €{company["subscription price/ month"]}/month
                            </div>
                        </div>
                    )}
                    {company["percentage fee"] && company["percentage fee"] > 0 && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Percentage:</span>
                            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                                {company["percentage fee"]}%
                            </div>
                        </div>
                    )}
                    {company["Hourly rate"] && company["Hourly rate"] > 0 && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Hourly:</span>
                            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                                €{company["Hourly rate"]}/hr
                            </div>
                        </div>
                    )}
                    {company["Fixed price"] && company["Fixed price"] > 0 && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Fixed:</span>
                            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                                €{company["Fixed price"]}
                            </div>
                        </div>
                    )}
                    {(!company["subscription price/ month"] || company["subscription price/ month"] <= 0) &&
                        (!company["percentage fee"] || company["percentage fee"] <= 0) &&
                        (!company["Hourly rate"] || company["Hourly rate"] <= 0) &&
                        (!company["Fixed price"] || company["Fixed price"] <= 0) && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                                Free
                            </div>
                        )}
                </div>
            </div>

            {/* Company Type Bubbles */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '16px'
            }}>
                <span style={{
                    background: 'rgba(147, 51, 234, 0.2)',
                    color: '#9333ea',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Building2 size={12} />
                    {getCompanyType()}
                </span>
                <span style={{
                    background: 'rgba(147, 51, 234, 0.2)',
                    color: '#9333ea',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Globe size={12} />
                    {getCustomerType()}
                </span>
                {company.URL && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(company.URL, '_blank', 'scrollbars=yes,resizable=yes');
                        }}
                        style={{
                            background: 'rgba(147, 51, 234, 0.2)',
                            color: '#9333ea',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                        }}
                    >
                        <Tag size={12} />
                        Visit Website
                    </button>
                )}
            </div>
        </div>
    );
};

// CompanyDetailModal component removed to eliminate TypeScript warnings

// SearchBar component removed to eliminate TypeScript warnings

// Main Component
export default function AutomationCompanies() {
    const { user } = useAuth();
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
    const { needsProfile, loading: profileLoading } = useProfileCheck(user);

    // Filter dropdown states
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showPricingDropdown, setShowPricingDropdown] = useState(false);
    const [showWhoPaysDropdown, setShowWhoPaysDropdown] = useState(false);

    // Job statistics state
    const [jobStats, setJobStats] = useState<IndustryStats[]>([]);
    const [sourceJobStats, setSourceJobStats] = useState<SourceJobStats>({});
    const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
    const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
    const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);

    // Industry color mapping function
    const getIndustryColor = (industry: string | undefined): string => {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ] as const;
        if (!industry || industry.length === 0) {
            return colors[0];
        }
        const index = industry.charCodeAt(0) % colors.length;
        return colors[index] as string;
    };

    // Calculator state
    const [rate, setRate] = useState<number | ''>(75);
    const [hours, setHours] = useState<number | ''>(32);
    const [weeksPerMonth, setWeeksPerMonth] = useState<number | ''>(4);
    const [months, setMonths] = useState<number | ''>(3);
    const [tax, setTax] = useState<number>(21);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [monthlyTotal, setMonthlyTotal] = useState<number>(0);

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
        setMonthlyTotal(monthlySubtotalCalc + monthlyTaxAmountCalc);
    }, [rate, hours, weeksPerMonth, months, tax]);



    const fetchJobStats = async () => {
        try {
            const { data, error } = await supabase
                .from('Allgigs_All_vacancies_NEW')
                .select('Industry, Source')
                .limit(50000);

            if (error) {
                console.error('Error fetching job stats:', error);
                return;
            }

            if (!data || data.length === 0) {
                return;
            }

            const industryCounts: { [key: string]: number } = {};
            const sourceCounts: SourceJobStats = {};
            let total = 0;

            data.forEach(job => {
                const industry = job.Industry || 'Unknown';
                let source = job.Source || 'Unknown';

                // Merge LinkedIn sources into one
                if (source && source.toLowerCase().includes('linkedin') ||
                    source && source.toLowerCase().includes('linkedininterim') ||
                    source && source.toLowerCase().includes('linkedinzzp') ||
                    source && source.toLowerCase().includes('linked')) {
                    source = 'LinkedIn';
                }

                // Count by industry
                industryCounts[industry] = (industryCounts[industry] || 0) + 1;
                total++;

                // Count by source and industry
                if (!sourceCounts[source]) {
                    sourceCounts[source] = { total: 0 };
                }
                const sourceData = sourceCounts[source];
                if (sourceData) {
                    sourceData[industry] = (sourceData[industry] || 0) + 1;
                    sourceData.total++;
                }
            });

            // Convert to array and calculate percentages
            const industryStats: IndustryStats[] = Object.entries(industryCounts)
                .map(([industry, count]) => ({
                    industry,
                    count,
                    percentage: total > 0 ? (count / total) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count);

            setJobStats(industryStats);
            setSourceJobStats(sourceCounts);
        } catch (err) {
            console.error('Error fetching job stats:', err);
        }
    };

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('automation_details')
                .select('*')
                .order('Company_name');

            if (error) {
                throw error;
            }

            setCompanies(data || []);
            setFilteredCompanies(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = companies;

        // Filter by selected industries and sources
        if (selectedIndustries.size > 0 || selectedSources.size > 0) {
            filtered = filtered.filter(company => {
                const companyData = sourceJobStats[company.Company_name];
                if (!companyData) return false;

                // Check if company has jobs in selected industries
                if (selectedIndustries.size > 0) {
                    const hasSelectedIndustry = Array.from(selectedIndustries).some(industry =>
                        companyData[industry] && companyData[industry] > 0
                    );
                    if (!hasSelectedIndustry) return false;
                }

                // Check if company matches selected sources
                if (selectedSources.size > 0) {
                    const hasSelectedSource = selectedSources.has(company.Company_name);
                    if (!hasSelectedSource) return false;
                }

                return true;
            });
        }

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
    }, [searchTerm, modelFilter, customerFilter, pricingModelFilter, whoPaysFilter, companies, selectedIndustries, selectedSources, sourceJobStats]);

    useEffect(() => {
        fetchCompanies();
        fetchJobStats();
    }, []);

    if (profileLoading) {
        return <div className="loading">Loading...</div>;
    }

    if (needsProfile) {
        return <CompleteProfileForm onComplete={() => {
            // Profile completed, no need to check user again
        }} />;
    }

    if (loading) {
        return <div className="loading">Loading companies...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'black',
            fontFamily: "'Montserrat', Arial, sans-serif",
            color: '#fff',
            padding: '20px'
        }}>
            {/* Header Section */}
            <div style={{
                marginBottom: '40px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 16px 0'
                }}>
                    allGigs Job Boards
                </h1>
                <p style={{
                    fontSize: '20px',
                    color: '#9ca3af',
                    margin: '0'
                }}>
                    {filteredCompanies.length} of {companies.length} companies
                </p>
            </div>

            {/* Calculator Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '40px',
                backdropFilter: 'blur(8px)'
            }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#fff',
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Calculator size={24} style={{ color: '#9333ea' }} />
                    Cost Calculator
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            Hourly Rate (€)
                        </label>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                                width: '100%',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '8px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            Hours per Week
                        </label>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                                width: '100%',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '8px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            Weeks per Month
                        </label>
                        <input
                            type="number"
                            value={weeksPerMonth}
                            onChange={(e) => setWeeksPerMonth(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                                width: '100%',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '8px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            Months
                        </label>
                        <input
                            type="number"
                            value={months}
                            onChange={(e) => setMonths(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                                width: '100%',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '8px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            Tax Rate (%)
                        </label>
                        <input
                            type="number"
                            value={tax}
                            onChange={(e) => setTax(Number(e.target.value))}
                            style={{
                                width: '100%',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '8px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                {/* Calculator Results */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0'
                        }}>
                            <span style={{ color: '#9ca3af' }}>Subtotal:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>€{subtotal.toFixed(1)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0'
                        }}>
                            <span style={{ color: '#9ca3af' }}>Tax Amount:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>€{taxAmount.toFixed(1)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            paddingTop: '16px'
                        }}>
                            <span style={{ color: '#fff', fontWeight: '600' }}>Total:</span>
                            <span style={{ color: '#9333ea', fontWeight: '700', fontSize: '18px' }}>€{total.toFixed(1)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0'
                        }}>
                            <span style={{ color: '#9ca3af' }}>Monthly:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>€{monthlyTotal.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div style={{
                marginBottom: '40px'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '150px', marginRight: '24px' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6b7280'
                        }} />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                paddingLeft: '24px',
                                paddingRight: '0px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                backdropFilter: 'blur(8px)'
                            }}
                        />
                    </div>

                    {/* Model Filter */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <button
                            onClick={() => {
                                setShowModelDropdown(!showModelDropdown);
                                setShowCustomerDropdown(false);
                                setShowPricingDropdown(false);
                                setShowWhoPaysDropdown(false);
                                setShowIndustryDropdown(false);
                                setShowSourceDropdown(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {modelFilter === 'all' ? 'All Models' :
                                modelFilter === 'paid' ? 'Paid Only' : 'Free Only'}
                            <ChevronDown size={16} />
                        </button>

                        {showModelDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                right: '0',
                                background: 'black',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                marginTop: '8px',
                                padding: '16px',
                                zIndex: 1000,
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <button
                                        onClick={() => setModelFilter('all')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: modelFilter === 'all' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setModelFilter('paid')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: modelFilter === 'paid' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Paid
                                    </button>
                                    <button
                                        onClick={() => setModelFilter('free')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: modelFilter === 'free' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Free
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Filter */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <button
                            onClick={() => {
                                setShowCustomerDropdown(!showCustomerDropdown);
                                setShowModelDropdown(false);
                                setShowPricingDropdown(false);
                                setShowWhoPaysDropdown(false);
                                setShowIndustryDropdown(false);
                                setShowSourceDropdown(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {customerFilter === 'all' ? 'All Customers' :
                                customerFilter === 'private' ? 'Private Only' :
                                    customerFilter === 'semi-gov' ? 'Semi-Government' : 'Government Only'}
                            <ChevronDown size={16} />
                        </button>

                        {showCustomerDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                right: '0',
                                background: 'black',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                marginTop: '8px',
                                padding: '16px',
                                zIndex: 1000,
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <button
                                        onClick={() => setCustomerFilter('all')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: customerFilter === 'all' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setCustomerFilter('private')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: customerFilter === 'private' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Private
                                    </button>
                                    <button
                                        onClick={() => setCustomerFilter('semi-gov')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: customerFilter === 'semi-gov' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Semi-Gov
                                    </button>
                                    <button
                                        onClick={() => setCustomerFilter('government')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: customerFilter === 'government' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Government
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Model Filter */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <button
                            onClick={() => {
                                setShowPricingDropdown(!showPricingDropdown);
                                setShowModelDropdown(false);
                                setShowCustomerDropdown(false);
                                setShowWhoPaysDropdown(false);
                                setShowIndustryDropdown(false);
                                setShowSourceDropdown(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {pricingModelFilter === 'all' ? 'All Pricing' :
                                pricingModelFilter === 'subscription' ? 'Subscription' :
                                    pricingModelFilter === 'transaction' ? 'Transaction' :
                                        pricingModelFilter === 'percentage' ? 'Percentage' :
                                            pricingModelFilter === 'hourly' ? 'Hourly' : 'Fixed Price'}
                            <ChevronDown size={16} />
                        </button>

                        {showPricingDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                right: '0',
                                background: 'black',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                marginTop: '8px',
                                padding: '16px',
                                zIndex: 1000,
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <button
                                        onClick={() => setPricingModelFilter('all')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: pricingModelFilter === 'all' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setPricingModelFilter('subscription')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: pricingModelFilter === 'subscription' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Subscription
                                    </button>
                                    <button
                                        onClick={() => setPricingModelFilter('percentage')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: pricingModelFilter === 'percentage' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Percentage
                                    </button>
                                    <button
                                        onClick={() => setPricingModelFilter('hourly')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: pricingModelFilter === 'hourly' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Hourly
                                    </button>
                                    <button
                                        onClick={() => setPricingModelFilter('fixed')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: pricingModelFilter === 'fixed' ? '#9333ea' : 'rgba(147, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Fixed
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Who Pays Filter */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <button
                            onClick={() => {
                                setShowWhoPaysDropdown(!showWhoPaysDropdown);
                                setShowModelDropdown(false);
                                setShowCustomerDropdown(false);
                                setShowPricingDropdown(false);
                                setShowIndustryDropdown(false);
                                setShowSourceDropdown(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {whoPaysFilter === 'all' ? 'All Payment Types' :
                                whoPaysFilter === 'employer' ? 'Employer Pays' : 'Freelancer Pays'}
                            <ChevronDown size={16} />
                        </button>

                        {showWhoPaysDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                right: '0',
                                background: 'black',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                marginTop: '8px',
                                padding: '16px',
                                zIndex: 1000,
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <button
                                        onClick={() => setWhoPaysFilter('all')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: whoPaysFilter === 'all' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setWhoPaysFilter('employer')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: whoPaysFilter === 'employer' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Employer
                                    </button>
                                    <button
                                        onClick={() => setWhoPaysFilter('freelancer')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: whoPaysFilter === 'freelancer' ? '#9333ea' : 'rgba(147, 51, 234, 0.2)',
                                            border: '1px solid rgba(147, 51, 234, 0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Freelancer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Industry Filter */}
                    {jobStats.length > 0 && (
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                            <button
                                onClick={() => {
                                    setShowIndustryDropdown(!showIndustryDropdown);
                                    setShowModelDropdown(false);
                                    setShowCustomerDropdown(false);
                                    setShowPricingDropdown(false);
                                    setShowWhoPaysDropdown(false);
                                    setShowSourceDropdown(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                Industries ({selectedIndustries.size > 0 ? selectedIndustries.size : 'All'})
                                <ChevronDown size={16} />
                            </button>

                            {showIndustryDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    right: '0',
                                    background: 'black',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                    padding: '16px',
                                    zIndex: 1000,
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                            Select Industries
                                        </span>
                                        <button
                                            onClick={() => setSelectedIndustries(new Set())}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'rgba(107, 114, 128, 0.3)',
                                                border: '1px solid rgba(107, 114, 128, 0.5)',
                                                borderRadius: '4px',
                                                color: '#9ca3af',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {jobStats.map(({ industry, count, percentage }) => (
                                            <label key={industry} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                background: selectedIndustries.has(industry) ? 'rgba(147, 51, 234, 0.2)' : 'transparent'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIndustries.has(industry)}
                                                    onChange={(e) => {
                                                        const newSelected = new Set(selectedIndustries);
                                                        if (e.target.checked) {
                                                            newSelected.add(industry);
                                                        } else {
                                                            newSelected.delete(industry);
                                                        }
                                                        setSelectedIndustries(newSelected);
                                                    }}
                                                    style={{
                                                        accentColor: '#9333ea',
                                                        transform: 'scale(1.2)'
                                                    }}
                                                />
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    backgroundColor: getIndustryColor(industry),
                                                    flexShrink: 0
                                                }} />
                                                <span style={{
                                                    color: '#fff',
                                                    flex: 1,
                                                    fontSize: '14px'
                                                }}>
                                                    {industry}
                                                </span>
                                                <span style={{
                                                    color: '#9ca3af',
                                                    fontSize: '12px'
                                                }}>
                                                    {count.toLocaleString()} ({percentage.toFixed(1)}%)
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Source Filter */}
                    {Object.keys(sourceJobStats).length > 0 && (
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                            <button
                                onClick={() => {
                                    setShowSourceDropdown(!showSourceDropdown);
                                    setShowModelDropdown(false);
                                    setShowCustomerDropdown(false);
                                    setShowPricingDropdown(false);
                                    setShowWhoPaysDropdown(false);
                                    setShowIndustryDropdown(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                Job Sources ({selectedSources.size > 0 ? selectedSources.size : 'All'})
                                <ChevronDown size={16} />
                            </button>

                            {showSourceDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    right: '0',
                                    background: 'black',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                    padding: '16px',
                                    zIndex: 1000,
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                            Select Job Sources
                                        </span>
                                        <button
                                            onClick={() => setSelectedSources(new Set())}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'rgba(107, 114, 128, 0.3)',
                                                border: '1px solid rgba(107, 114, 128, 0.5)',
                                                borderRadius: '4px',
                                                color: '#9ca3af',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {Object.entries(sourceJobStats)
                                            .sort(([, a], [, b]) => b.total - a.total)
                                            .map(([source, data]) => (
                                                <label key={source} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    background: selectedSources.has(source) ? 'rgba(147, 51, 234, 0.2)' : 'transparent'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSources.has(source)}
                                                        onChange={(e) => {
                                                            const newSelected = new Set(selectedSources);
                                                            if (e.target.checked) {
                                                                newSelected.add(source);
                                                            } else {
                                                                newSelected.delete(source);
                                                            }
                                                            setSelectedSources(newSelected);
                                                        }}
                                                        style={{
                                                            accentColor: '#9333ea',
                                                            transform: 'scale(1.2)'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: '#fff',
                                                        flex: 1,
                                                        fontSize: '14px'
                                                    }}>
                                                        {source}
                                                    </span>
                                                    <span style={{
                                                        color: '#9ca3af',
                                                        fontSize: '12px'
                                                    }}>
                                                        {data.total.toLocaleString()} jobs
                                                    </span>
                                                </label>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Companies Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '24px'
            }}>
                {filteredCompanies.map((company) => (
                    <CompanyCard
                        key={company.id}
                        company={company}
                        sourceJobStats={sourceJobStats}
                        getIndustryColor={getIndustryColor}
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
                    />
                ))}
            </div>

            {/* Selected Companies Costs */}
            {selectedCompanies.size > 0 && (
                <div style={{
                    marginTop: '40px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    backdropFilter: 'blur(8px)'
                }}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#fff',
                        margin: '0 0 20px 0'
                    }}>
                        Selected Companies Costs
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {Array.from(selectedCompanies).map(companyId => {
                            const company = companies.find(c => c.id === companyId);
                            if (!company) return null;

                            let companyMonthlyCost = 0;
                            let companyQuarterlyCost = 0;
                            const costBreakdown = [];

                            // Calculate costs for this company
                            if (company["subscription price/ month"] && company["subscription price/ month"] > 0) {
                                companyMonthlyCost += company["subscription price/ month"];
                                companyQuarterlyCost += company["subscription price/ month"] * 3;
                                costBreakdown.push({
                                    label: "Subscription fees:",
                                    monthly: company["subscription price/ month"],
                                    quarterly: company["subscription price/ month"] * 3
                                });
                            }

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

                            if (company["transaction fees"] && company["transaction fees"] > 0) {
                                companyMonthlyCost += company["transaction fees"];
                                companyQuarterlyCost += company["transaction fees"] * 3;
                                costBreakdown.push({
                                    label: "Transaction fees:",
                                    monthly: company["transaction fees"],
                                    quarterly: company["transaction fees"] * 3
                                });
                            }

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

                            if (company["Fixed price"] && company["Fixed price"] > 0) {
                                companyMonthlyCost += company["Fixed price"];
                                companyQuarterlyCost += company["Fixed price"] * 3;
                                costBreakdown.push({
                                    label: "Fixed price:",
                                    monthly: company["Fixed price"],
                                    quarterly: company["Fixed price"] * 3
                                });
                            }

                            if (costBreakdown.length === 0) {
                                costBreakdown.push({
                                    label: "Free",
                                    monthly: 0,
                                    quarterly: 0
                                });
                            }

                            return (
                                <div key={company.id} style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <h4 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#fff',
                                            margin: '0'
                                        }}>
                                            {company.Company_name}
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const newSelected = new Set(selectedCompanies);
                                                newSelected.delete(company.id);
                                                setSelectedCompanies(newSelected);
                                            }}
                                            style={{
                                                background: '#dc3545',
                                                color: '#fff',
                                                border: 'none',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div style={{
                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                        paddingTop: '16px'
                                    }}>
                                        {costBreakdown.map((cost, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px'
                                            }}>
                                                <span style={{ color: '#9ca3af', fontSize: '14px' }}>{cost.label}</span>
                                                <span style={{ color: '#fff', fontWeight: '500', fontSize: '14px' }}>
                                                    €{cost.monthly.toFixed(1)}/month
                                                </span>
                                            </div>
                                        ))}
                                        <div style={{
                                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                            paddingTop: '12px',
                                            marginTop: '12px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px'
                                            }}>
                                                <span style={{ color: '#fff', fontWeight: '600' }}>Total:</span>
                                                <span style={{ color: '#9333ea', fontWeight: '700' }}>
                                                    €{companyMonthlyCost.toFixed(1)}/month | €{companyQuarterlyCost.toFixed(1)}/quarter
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Company Detail Modal */}
            {selectedCompany && (
                <div style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'black',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#fff',
                                margin: '0'
                            }}>
                                {selectedCompany.Company_name}
                            </h2>
                            <button
                                onClick={() => setSelectedCompany(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '8px'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '24px'
                        }}>
                            <div>
                                <h3 style={{ color: '#9333ea', fontSize: '18px', marginBottom: '12px' }}>Company Details</h3>
                                <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                    <strong>Type:</strong> {selectedCompany["job board"] ? 'Job Board' :
                                        selectedCompany["recruitment company"] ? 'Recruitment Company' :
                                            selectedCompany["recruitment tech"] ? 'Recruitment Tech' : 'Other'}
                                </p>
                                <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                    <strong>Customer Type:</strong> {selectedCompany.government ? 'Government' :
                                        selectedCompany["semi government"] ? 'Semi-Government' :
                                            selectedCompany["private company"] ? 'Private Company' : 'Mixed'}
                                </p>
                                {selectedCompany.URL && (
                                    <button
                                        onClick={() => window.open(selectedCompany.URL, '_blank', 'scrollbars=yes,resizable=yes')}
                                        style={{
                                            background: '#9333ea',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            marginTop: '16px'
                                        }}
                                    >
                                        Visit Website
                                    </button>
                                )}
                            </div>

                            <div>
                                <h3 style={{ color: '#9333ea', fontSize: '18px', marginBottom: '12px' }}>Pricing Details</h3>
                                <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                    <strong>Model:</strong> {selectedCompany["paid/free"] || 'Not specified'}
                                </p>
                                <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                    <strong>Who Pays:</strong> {selectedCompany["paid by employer"] === true ? 'Employer' :
                                        selectedCompany["paid by employer"] === false ? 'Freelancer' : 'Not specified'}
                                </p>
                                <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                    <strong>Pricing Info:</strong> {selectedCompany["Pricing info found?"] === true || selectedCompany["Pricing info found?"] === 'yes' ? 'Yes' :
                                        selectedCompany["Pricing info found?"] === false || selectedCompany["Pricing info found?"] === 'no' ? 'No' : 'Not specified'}
                                </p>
                            </div>
                        </div>

                        {selectedCompany["Company description"] && (
                            <div style={{ marginTop: '24px' }}>
                                <h3 style={{ color: '#9333ea', fontSize: '18px', marginBottom: '12px' }}>Description</h3>
                                <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>
                                    {selectedCompany["Company description"]}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}