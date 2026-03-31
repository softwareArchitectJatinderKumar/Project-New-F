import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-staticfooter',
    templateUrl: './staticFooter.html',
    styleUrls: ['./staticFooter.scss']
})
export class StaticFooterComponent implements OnInit {
    activeNirfTab: string = 'tabs-24';

    nirfTabs = [
        { id: 'tabs-24', label: '2025' },
        { id: 'tabs-38', label: '2024' },
        { id: 'tabs-23', label: '2023' },
    ];

    nirfData: Record<string, { label: string; url: string }[]> = {
        'tabs-24': [
            { label: 'Management', url: 'https://www.lpu.in/downloads/nirf/2025/Management.pdf' },
            { label: 'Pharmacy', url: 'https://www.lpu.in/downloads/nirf/2025/Pharmacy.pdf' },
            { label: 'Engineering', url: 'https://www.lpu.in/downloads/nirf/2025/Engineering.pdf' },
            { label: 'Overall', url: 'https://www.lpu.in/downloads/nirf/2025/Overall.pdf' },
            { label: 'Law', url: 'https://www.lpu.in/downloads/nirf/2025/Law.pdf' },
            { label: 'Architecture', url: 'https://www.lpu.in/downloads/nirf/2025/Architecture.pdf' },
            { label: 'Innovation', url: 'https://www.lpu.in/downloads/nirf/2025/Innovation.pdf' },
            { label: 'Agriculture', url: 'https://www.lpu.in/downloads/nirf/2025/Agriculture.pdf' },
            { label: 'SDG Institution', url: 'https://www.lpu.in/downloads/nirf/2025/SDG-institution.pdf' },
        ],
        'tabs-38': [
            { label: 'Management', url: 'https://www.lpu.in/downloads/nirf/2024/Management.pdf' },
            { label: 'Pharmacy', url: 'https://www.lpu.in/downloads/nirf/2024/Pharmacy.pdf' },
            { label: 'Engineering', url: 'https://www.lpu.in/downloads/nirf/2024/Engineering.pdf' },
            { label: 'Overall', url: 'https://www.lpu.in/downloads/nirf/2024/Overall.pdf' },
            { label: 'Law', url: 'https://www.lpu.in/downloads/nirf/2024/Law.pdf' },
            { label: 'Architecture', url: 'https://www.lpu.in/downloads/nirf/2024/Architecture.pdf' },
            { label: 'Innovation', url: 'https://www.lpu.in/downloads/nirf/2024/Innovation.pdf' },
            { label: 'Agriculture', url: 'https://www.lpu.in/downloads/nirf/2024/Agriculture.pdf' },
        ],
        'tabs-23': [
            { label: 'Management', url: 'https://www.lpu.in/downloads/nirf/2023/Management.pdf' },
            { label: 'Pharmacy', url: 'https://www.lpu.in/downloads/nirf/2023/Pharmacy.pdf' },
            { label: 'Engineering', url: 'https://www.lpu.in/downloads/nirf/2023/Engineering.pdf' },
            { label: 'Overall', url: 'https://www.lpu.in/downloads/nirf/2023/Overall.pdf' },
            { label: 'Law', url: 'https://www.lpu.in/downloads/nirf/2023/Law.pdf' },
            { label: 'Architecture', url: 'https://www.lpu.in/downloads/nirf/2023/Architecture.pdf' },
            { label: 'Agriculture', url: 'https://www.lpu.in/downloads/nirf/2023/Agriculture.pdf' },
        ],
    };

    admissionLinks = [
        { label: 'Admissions 2026-27', url: 'https://www.lpu.in/admission/admissions.php' },
        { label: 'International Admission 2026-27', url: 'https://www.lpu.in/international/' },
        { label: 'Distance Education Admissions', url: 'https://www.lpude.in/admissions/overview.php' },
        { label: 'Online Education Admissions', url: 'https://www.lpuonline.com/' },
        { label: 'Scholarship & Financial Aid', url: 'https://www.lpu.in/scholarship/scholarship.php' },
        { label: 'Fee Deposits', url: 'https://www.lpu.in/frmloginaccounts.aspx' },
        { label: 'FAQs', url: 'https://www.lpu.in/faq.php' },
        { label: 'LPU Blog', url: 'https://www.lpu.in/blog' },
        { label: 'Download Prospectus', url: 'https://www.lpu.in/admission/prospectus-and-forms.php' },
    ];

    academicLinks = [
        { label: 'Joint Placement Drive', url: 'https://www.lpu.in/jpd' },
        { label: 'Alumni', url: 'https://alumni.lpu.in/' },
        { label: 'Entrepreneurship', url: 'https://www.lpu.in/campus-life/entrepreneurship.php' },
        { label: 'Top Engineering College in India', url: 'https://www.lpu.in/engineering/' },
        { label: 'Top MBA Colleges', url: 'https://www.lpu.in/mba/' },
        { label: 'Entitlement Application (OL)', url: 'https://lpu.in/downloads/UGC-Application-OL-2025-26.pdf' },
        { label: 'Entitlement Application (ODL)', url: 'https://lpu.in/downloads/UGC-Application-ODL-2025-26.pdf' },
    ];

    resourceLinks = [
        { label: 'Convocations@LPU', url: 'https://www.lpu.in/convocation/convocation-pictures.php' },
        { label: 'Distance Education', url: 'http://www.lpude.in/' },
        { label: 'Online Education', url: 'https://www.lpuonline.com/' },
        { label: 'Online Fee Payment', url: 'https://www.lpu.in/frmLoginAccounts.aspx' },
        { label: 'UMS Login', url: 'https://ums.lpu.in/lpuums/' },
        { label: 'Apply Certificate', url: 'https://ums.lpu.in/lpuums/LoginNew.aspx?loginPage=ExtCert' },
        { label: 'eSanad', url: 'https://www.lpu.in/esanad/' },
        { label: 'UGC Cyber Hygiene Handbook', url: 'https://www.lpu.in/downloads/a_handbook_on_basics_of_cyber_hygiene.pdf' },
    ];

    otherLinks = [
        { label: 'NISP', url: 'https://www.lpu.in/downloads/nisp.pdf' },
        { label: 'NIRF', url: '', modal: 'nirf' },
        { label: 'UGC Public Self Disclosure', url: 'https://www.lpu.in/downloads/ugc-public-self-disclosure.pdf' },
        { label: 'Act', url: 'https://www.lpu.in/lpu-assets/download/act/act.pdf' },
        { label: 'UGC e-Samadhan Portal', url: 'https://samadhaan.ugc.ac.in' },
        { label: 'Supplier Registration', url: 'https://docs.google.com/forms/d/e/1FAIpQLScHTG-vQoSOKIRPGnuNZ2bc66M6BOpJXOxBUxOFAUdfz35UkA/viewform' },
        { label: 'Careers @ LPU', url: 'https://www.lpu.in/jobs' },
        { label: "Parent's Login", url: 'https://ums.lpu.in/lpuums' },
        { label: 'Tenders', url: 'https://lpu.in/tenders/' },
    ];

    socialLinks = [
        { label: 'Facebook', url: 'https://www.facebook.com/LPUUniversity', icon: 'facebook' },
        { label: 'Twitter / X', url: 'https://twitter.com/lpuuniversity', icon: 'twitter' },
        { label: 'Instagram', url: 'https://www.instagram.com/lpuuniversity/', icon: 'instagram' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/company/lovely-professional-university', icon: 'linkedin' },
        { label: 'YouTube', url: 'https://www.youtube.com/user/LPUuniversity', icon: 'youtube' },
    ];

    bottomLinks = [
        { label: 'Anti Ragging', url: 'https://www.lpu.in/anti-ragging.php' },
        { label: 'ICC', url: '', modal: 'sexual-harrassment-footer' },
        { label: 'Privacy Policy', url: 'https://www.lpu.in/privacy.php' },
        { label: 'Disclaimer', url: 'https://www.lpu.in/disclaimer.php' },
        { label: 'Terms and Conditions', url: 'https://www.lpu.in/terms-conditions.php' },
        { label: 'Student Grievance Redressal', url: 'https://www.lpu.in/student-grievance-redressal.php' },
        { label: 'Caste Based Discrimination', url: 'https://www.lpu.in/caste-based-discrimination.php' },
        { label: 'RTI', url: 'https://www.lpu.in/rti' },
        { label: 'Feedback', url: 'https://lovelyprofessionaluniversity.outgrow.us/LPU-Website-Survey' },
    ];

    showNirfModal = false;
    showIccModal = false;

    ngOnInit(): void { }

    setNirfTab(tabId: string): void {
        this.activeNirfTab = tabId;
    }

    openModal(modalId: string | undefined): void {
        if (!modalId) return;
        if (modalId === 'nirf') this.showNirfModal = true;
        if (modalId === 'sexual-harrassment-footer') this.showIccModal = true;
    }

    closeNirfModal(): void { this.showNirfModal = false; }
    closeIccModal(): void { this.showIccModal = false; }
}


