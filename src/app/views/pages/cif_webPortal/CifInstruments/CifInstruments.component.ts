
import swal from 'sweetalert2';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { Specification } from './specification.model';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface FAQ {
  question: string;
  isOpen: boolean;
  answer: string;
}

@Component({
  selector: 'app-CifInstruments',
  templateUrl: './CifInstruments.component.html',
  styleUrls: ['./CifInstruments.component.scss'],
  standalone: false,
  animations: [
    trigger('slideInOut', [
      state('void', style({ height: '0px', opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class CifInstrumentsComponent implements OnInit {
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
  // Method to scroll to the Facilities section
  gotoFacilities() {
    this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
  ColumnMode = ColumnMode;
  columns: any;
  loadingIndicator = false;
  headHtmlData: any[] = [];
  p: any = 1;
  perPage: any = 5;
  @ViewChild('table') table: ElementRef;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
    'totalCharges', 'remarks', 'bookingRequestDate',
  ];
  instrumentStatus: string = '';
  isInstrumentActive: boolean = false;
  specifications: Specification[] = [];
  cifInstrumentsDataData: any[] = [];
  ResultData: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  tmpscifInstrumentsDataData: any[] = [];
  InstrumentId: number | null = null;
  instrumentName: any = '';
  UserRole: any;
  UserId: any;
  uploadEnabled: boolean;
  Remarks: any;
  dataSource: any;
  ServerUrl: any;
  Description: any;
  ImageUrl: any;
  categoryId: number | null = null;
  selectedInstrument: any = null;
  cifInstrumentsCharges: any;
  tmpscifInstrumentsCharges: any;
  Name: any;
  constructor(
    private CIFwebService: LpuCIFWebService,
    private storageService: StorageService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) document: Document,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private AuthSession: LoginSessionService,
    private router: Router,
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('Name');
      const idParam = params.get('id');
      const catParam = params.get('categoryId');

      this.Name = nameParam ?? '';

      this.InstrumentId = idParam ? Number(idParam) : null;
      this.categoryId = catParam ? Number(catParam) : null;

      const instrumentData = (this.tmpscifInstrumentsDataData && this.tmpscifInstrumentsDataData.length > 0)
        ? this.tmpscifInstrumentsDataData
        : this.DataItems;

      let effectiveCategory = this.categoryId;
      if ((!effectiveCategory || effectiveCategory === 0) && this.InstrumentId) {
        const inst = instrumentData.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
        if (inst && inst.categoryId != null) {
          effectiveCategory = inst.categoryId;
        }
      }

      if (this.InstrumentId) {
        this.fetchSpecifications(effectiveCategory, this.InstrumentId);
      }
    });

    this.getAllInstrumentss();
    this.getAllInstruments();
  }

  DataItems = [
    {
      "id": 1,
      "instrumentId": 0,
      "instrumentName": "Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS",
      "categoryId": 1,
      "isActive": true,
      "description": "The Jeol field emission scanning electron microscope is a versatile high resolution scanning electron microscope. This Machine combines two proven technologies – an electron column with semi-in-lens objective lens which can provide high resolution imaging by low accelerating voltage and an in-lens Schottky FEG which can provide stable large probe current – to deliver ultrahigh resolution with wide range of probe currents for all applications (A few pA to more than 200 nA). The in-lens Schottky FEG is a combination of a Schottky FEG and the first condenser lens and is designed to collect the electrons from the emitter efficiently. The Gentle Beam (GB) mode applies a negative voltage to a specimen and decelerates incident electrons just before they irradiate the specimen, thus the resolution is improved at an extremely low accelerating voltage. Therefore, this instrument is possible to observe a topmost surface by a few hundred eV which were difficult to observe conventionally and nonconductive samples \r\nsuch as ceramics and semiconductor etc. The High-Power Optics produces fine electron probe for both observation and analysis. The aperture angle control lens maintains a small probe diameter even at a larger probe current. Using both techniques, the machine is suitable for a wide variety of analysis with EDS.\r\nApart from giving the high resolution surface morphological images, this machine also has the analytical capabilities such as detecting the presence of elements down to boron (B) on any solid conducting materials through the energy dispersive X-ray spectrometry (EDX) providing crystalline information from the few nano meter depth of the material surface via electron back scattered detection (BSD) system attached with microscope. ",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG"
    },
    {
      "id": 2,
      "instrumentId": 0,
      "instrumentName": "Powder XRD (Bruker D8 Advance)",
      "categoryId": 2,
      "isActive": true,
      "description": "This Bruker equipment benchmark when it comes to extracting structural information from X-Ray Powder Diffraction including Rietveld (TOPAS) analysis, \"total\" scattering (PDF analysis), and Small Angle X-Ray Scattering (SAXS). \r\n\r\nMonochromatic Ka1 radiation with Johansson monochromators for Co, Cu and Mo radiation Highest intensity with focusing Göbel mirrors for Cr, Co, Cu, Mo and Ag radiation.\r\nDynamic Beam Optimization\r\nDynamic Beam Optimization (DBO) provides best in class powder diffraction data by setting new benchmarks in terms of counting statistics and peak-to-background ratio, all without the need for manual instrument reconfiguration.\r\n\r\nThe high-speed energy-dispersive LYNXEYE XE-T detector uniquely combines fast data collection with unprecedented filtering of fluorescence and Kß radiation. Its proprietary Variable Active Detector Window and the Motorized Anti-Scatter Screen (MASS) enable data collection from lowest 2? angles without parasitic low-angle background scattering, in particular air scattering. The fully automated MASS retraction avoids beam cropping, even in combination with continuously variable slits that provide superb counting statistics over the whole angular range.\r\n•\tSuperb counting statistics allows for faster data collection and increased sample throughput\r\n•\tNo parasitic low-angle background scattering massively improves data quality of pharma, clay, zeolite and other samples having a large unit cell\r\n•\tBest peak-to-background enhances sensitivity for minor phases\r\n•\tFull quantification of crystalline and amorphous phases with DIFFRACTOPAS\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG"
    },
    {
      "id": 3,
      "instrumentId": 0,
      "instrumentName": "FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)",
      "categoryId": 3,
      "isActive": true,
      "description": "In Infrared spectroscopy or vibrational spectroscopy is used to study the chemical composition of a sample. IR-radiations interact with the sample to produce infrared spectrum. Molecules with an overall electric dipole are when exposed to IR-radiation fluctuates the electromagnetic (EM) radiation. These fluctuations are the foot-prints of chemical compositions of the sample. Hence, to study the chemical composition of the sample the fluctuations of EM-radiations are recorded by the spectrophotometer. Fourier transform is employed to get the signal. Attenuated total reflection (ATR) is a sampling technique used in conjunction with infrared spectroscopy which enables samples to be examined directly in the solid or liquid state without further preparation. A unique humidity shield design protects Spectrum. Two from environmental effects allowing it to be used in more challenging environments, and with extended intervals between desiccant change to lower maintenance costs.\r\nAtmospheric Vapor Compensation (AVC) features an advanced digital filtering algorithm designated to subtract CO2 and H2O absorptions automatically in real time. The use of Sigma-Delta converters in the digitization of the FT-IR interferogram improves dynamic range, reduces spectral artifacts and increases ordinate linearity. Includes basic transmission functionality with optional fully integrated, robust universal sampling ensures trouble-free measurements.\r\nIt is equipped illuminated LCD display and user full set of extended special functions (i.e., counting of identical pieces, percentage indication, recipe making and many more) which are helpful during use of often repeated measurement activities. Further, RS232C connector allows for connecting computer, label printer or printer to print receipts, reports or weighing results archiving. Printed reports comply with requirements of GLP regulations. Procell software allows for direct transfer of weighing results to Excel spreadsheet\r\n\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG"
    },
    {
      "id": 4,
      "instrumentId": 0,
      "instrumentName": "Fluorescence Spectrometer (Perkin Elmer LS6500)",
      "categoryId": 4,
      "isActive": true,
      "description": "Fluorescence spectrophotometry is a technique that analyze the state of sample (normally a biological system) by studying its interactions with fluorescent probe molecules. This interaction is monitored by measuring the changes in the fluorescent probe optical properties. The measurement of fluorescence signals provides a sensitive method of monitoring the biochemical environment of a fluorophore. Fluorophores are polyatomic fluorescent molecules. Instruments have been designed to measure fluorescence intensity, spectrum, lifetime and polarization. The apparatus is equipped with several advanced facilities that can be used for the measurement of a large range of samples. This can also be used measure to understand complex biological processes and enzyme inhibition mechanism. Dyes, LEDs, tracers, solar cells, and organic electroluminescent materials can be analyzed using this technique. \r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG"
    },
    {
      "id": 5,
      "instrumentId": 0,
      "instrumentName": "Thermogravimetric analyzer (Perkin Elmer TGA 4000)",
      "categoryId": 5,
      "isActive": true,
      "description": "\r\nThermogravimetric analysis is an equipment that measures the change in weight and hence mass of a sample with change in temperature. Mass of a sample changes due to various chemical or physical changes sensed by the equipment as thermal events. These chemical/physical changes or thermal evens may be desorption, absorption, sublimation, vaporization, oxidation, reduction and decomposition. The study is carried out by subjecting the sample over a range of temperature can be programmed using the software provided with the equipment.\r\nThe apparatus is equipped with large isothermal zone provides excellent temperature reproducibility. Apart from these rapid furnace cooling facilities using tap water and integral forced air are available that more samples can be studied in less time. A constant environment for the balance maintained by the balance purge gas. This purge gas protects the balance from the reactive sample purge gas as well as materials evolved by the sample. A microbalance is used to measure the change in weight of the sample. The equipment is provided with a corrosion resistant furnace.\r\nIntegrated mass flow controller extends applications flexibility; monitors and controls purge flow rates and allows switching between any two gases. \r\nFew important applications of TGA are listed below:\r\n•\tCompositional analysis\r\n•\tDecomposition temperatures\r\n•\tEngine oil volatility\r\n•\tFlammability studies\r\n•\tMeasurement of volatiles\r\n•\tOxidative and thermal stabilities\r\n•\tCatalyst and coking studies\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG"
    },
    {
      "id": 6,
      "instrumentId": 0,
      "instrumentName": "Differential scanning calorimeter (Perkin Elmer DSC 6000)",
      "categoryId": 6,
      "isActive": true,
      "description": "Differential Scanning Calorimetry is a thermal analysis technique that measures the exchange of heat energy of any material during a physical or chemical change at constant pressure. The equipment measures the thermal behavior of a sample with respect to an inert sample which does not undergo any change upon heating over the specified range of temperatures. Thermal analysis of the sample can be studied under a controlled heating rate of a very high precision in a wide range of temperatures. These measurements will be carried out under inert environment. Flowing nitrogen gas will be used to achieve inert atmosphere. Oxidative properties can also be studied in flowing oxygen or air environment. The equipment is single-furnace design and uses heat-flux measurement principle. The equipment uses thermocouple-based temperature sensors. It has optional UV photocalorimeter accessory as well.\r\nThe equipment can be used for several applications. A small list of applications are given below: \r\n•\tGlass transition temperature\r\n•\tMelting points\r\n•\tCrystallization time and temperatures\r\n•\tHeats of melting and crystallization\r\n•\tPercentage of crystallinity\r\n•\tOxidative stabilities\r\n•\tHeat capacity\r\n•\tPurities\r\n•\tThermal stabilities\r\n•\tPolymorphism\r\n•\tTo test the quality of a product\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG"
    },
    {
      "id": 9,
      "instrumentId": 0,
      "instrumentName": "Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX",
      "categoryId": 7,
      "isActive": true,
      "description": "\r\nThe Gas Chromatograph - Mass Spectrometer, Shimadzu is Equipped with an ion source that features high sensitivity and long-term stability, and a high-efficiency collision cell, the system can provide sensitive, stable analyses over a long period of time. This device can be used for: \r\n•\tIn research and development, production, impurity profiling and quality control departments of pharmaceutical, chemical, agricultural, and biotechnological industries.\r\n•\tIn forensic toxicology to identify poisons and steroids in biological specimens.\r\n•\tIn detecting pollutants, metabolites in serum and fatty acid profiling in microbes.\r\n•\tFor the analysis of inorganic gases, aromatic solvents, detection of impurities and allergens in cosmetics.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG"
    },
    {
      "id": 10,
      "instrumentId": 0,
      "instrumentName": "High Performance and Liquid Chromatography, Shimadzu Prominence LPGE",
      "categoryId": 8,
      "isActive": true,
      "description": "\r\n This Shimadzu equipment is used in the analysis of pharmaceutical, toxicological, environmental, and biological samples. \r\n\r\n•\tQualitative analysis - Separation of thermally unstable chemical and biological compounds, e.g., drugs, organic chemicals, herbal medicines and plant extracts.\r\n•\tQuantitative analysis - To determine the concentration of a compound in a sample by measuring the height and area of the peak.\r\n•\tTrace analysis – Analysis of compounds present in very low concentrations in a sample. \r\nRI detector (universal detector) - Any component that differs in refractive index from an elute can be detected despite its low sensitivity. difficult to observe conventionally and nonconductive samples such as ceramics and semiconductor etc.\r\nMultiple solvent delivery options, a broad range of flows, and isocratic or gradient elution. PDA and RI detector options to cover a range of sample chemistries. Expandable valving options from simple to complex flow paths.\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG"
    },
    {
      "id": 11,
      "instrumentId": 0,
      "instrumentName": "Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204",
      "categoryId": 9,
      "isActive": true,
      "description": "\r\nMetrohum is a multi-channel Potentiostat/galvanostat which is useful in electrochemical measurements. It is a multi-channel potentiostat/galvanostat based on the compact Autolab PGSTAT204. This machine can be controlled from up to three different computers simultaneously, allowing to share, the available channels among different users. Further, this instrument is connected with FRA32M - Impedance analyzer which can perform EIS measurements and comes with a powerful fit and simulation software for the analysis of impedance data. Hence addition of FRA32M in the main unit allows users to perform both potentiostatic and galvanostatic impedance measurements over a wide frequency range of 10 µHz to 32 MHz (limited to 1 MHz in combination with the Autolab PGSTAT). In addition to the classical EIS, the NOVA software also allows the users to modulate other outside signals such as rotation speed of a rotating disk electrode or the frequency of a light source to perform Electro-hydrodynamic or Photo-modulated impedance spectroscopy. Further, For high current applications, M204 module can be connected to a BOOSTER10A to increase the maximum current to 10 A and with its fast response time, the Autolab booster is able to perform electrochemical impedance measurements, in combination with the FRA32M module.\r\nThe in-house available features e.g., cyclic voltammetry, linear sweep voltammetry, chronoamperometry, impedance spectroscopy, charge discharge characteristics provide powerful techniques for understanding reaction kinetics, sensing materials, corrosion, energy conversion and storage studies etc.\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG"
    },
    {
      "id": 12,
      "instrumentId": 0,
      "instrumentName": "Density merer (Axis Density Meter with analytical balance ALN-220)",
      "categoryId": 10,
      "isActive": true,
      "description": "\r\nDensity Meter with analytical balance, Wensar MAB-220T is a mechanical tool which is used to determine the density of solids allowing efficient measuring object mass at immersion in a liquid. Weighing and density determining is done by balance equipped with HYDRO special function performing arithmetical calculations. The MAB-220T analytical balanced used for the density measurements is a very high precision analytical balance for weight measurement. This analytical balance has a calibration system with internal weight, which assures maintaining of measurements precision during operation without user’s intervention.\r\n\r\nIt is equipped illuminated LCD display and user full set of extended special functions (i.e., counting of identical pieces, percentage indication, recipe making and many more) which are helpful during use of often repeated measurement activities. Further, RS232C connector allows for connecting computer, label printer or printer to print receipts, reports or weighing results archiving. Printed reports comply with requirements of GLP regulations. Procell software allows for direct transfer of weighing results to Excel spreadsheet. \r\n\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg"
    },
    {
      "id": 13,
      "instrumentId": 0,
      "instrumentName": "Refrigerated Centrifuge (Eppendorf  5804R)",
      "categoryId": 11,
      "isActive": true,
      "description": "\r\nRefrigerated Centrifuge is a high speed centrifuge for medium capacity needs. It allows for molecular applications in tubes up to 250 mL and offers additional swing–bucket and fixed–angle rotors as well as deep well plate capacity for increased versatility. Refrigerated Centrifuge is equipped with swing-bucket rotor A-4-44, 15/50 ml adapters and fixed-angle rotor F45-30-11 30 x 1.5/2 ml. A low temperature centrifuge is used to determine sedimentation velocity, shape and mass of macromolecules, separation of phases, isolate viruses, organelles, membranes and biomolecules such as DNA, RNA and lipoproteins. This can also be used for phase separation of nanomaterials\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG"
    },
    {
      "id": 14,
      "instrumentId": 0,
      "instrumentName": "Viscometer (LABMAN model of LMDV-200 with small sample adaptor low viscosity adaptor and software.)",
      "categoryId": 12,
      "isActive": true,
      "description": "\r\nThis Labman machine is Rotational Digital Direct Reading Viscometer to measure absolute viscosity of Newton Liquids as well apparent viscosity of non – Newton liquid featured by high flexibility reliable Test result, easy operation and good appearance. The Salient Features of the viscometer are auto range function, selectable speed direct viscosity reading and temperature display with big ultra-bright backlight LCD Display the High-Power Optics produces fine electron probe for both observation and analysis. The aperture angle control lens maintains a small probe diameter even at a larger probe current. Using both techniques, this machine is suitable for a wide variety of analysis with EDS. \r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_696381150_2_2025_100001_ADP_2298---.JPG"
    },
    {
      "id": 15,
      "instrumentId": 0,
      "instrumentName": "Particle size and Zeta potential analyzer (Malverrn Zetasizer Nano ZS90)",
      "categoryId": 13,
      "isActive": true,
      "description": "\r\n  Light scattering is a fundamental analytical technique for the characterization of particulate materials,\r\n  and is most commonly applied to colloidal systems, nanoparticles and macromolecules in solution or dispersion, \r\n  to determine particle size and Zeta Potential. Malvern Particle Size and\r\n  Zeta Potential Analyzer is used to measure particle and molecular size from less than a nanometre to several microns \r\n  using dynamic light scattering and Zeta Potential by using electrophoretic light scattering.\r\n  The particle size analyzer is the ideal tool for sub-micron analysis of size and zeta potential of dispersed particles of mineral, \r\n  chemical, ceramic, polymer, pharmaceutical and agricultural sciences. \r\n  The Zetasizer Nano ZS90 is the perfect lower cost solution when the ultimate in sizing sensitivity is not necessary, \r\n  or where identical results to a legacy system with 90° scattering optics is required. \r\n  • Zeta potential of colloids and nanoparticles using patented M3-PALS technology. \r\n  • A ‘Quality Factor’ and ‘Expert Advice System’ gives the confidence of having an expert at your shoulder.\r\n  • Research software option gives access to further features and analysis algorithms for the light scattering specialist. \r\n  • Automation of measurements using an auto titrator option. \r\n  ",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_284316046_2_2025_100010_Particle_Size-Instrument.JPG"
    },
    {
      "id": 21,
      "instrumentId": 0,
      "instrumentName": "Shimadzu UV-1800 UV-Vis",
      "categoryId": 14,
      "isActive": true,
      "description": "The UV-1800 is an advanced high-resolution (1-nm resolution in a compact double-beam instrument) spectrophotometer utilizing a precision Czerny-Turner optical system. The instrument is extremely versatile with full functionality from 190 nm to 1100 nm.  Operation can be either as a stand-alone instrument or as a PC-controlled instrument with the included UV Probe software. USB memory can be connected directly to the UV-1800 for simple data transfer.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1208223655_17_2025_100004_-14-UV.JPG"
    },
    {
      "id": 22,
      "instrumentId": 0,
      "instrumentName": "ICP-OES, PerkinElmer Optima 8000",
      "categoryId": 15,
      "isActive": true,
      "description": "The Optima 8000 is a bench-top, dual-view ICP-OES with full-wavelength-range CCD array detector, delivering flexibility and excellent analytical performance. The Optima™ 8000 ICP-OES gains its outstanding analytical performance from its novel optical system, including a unique double monochromator, dual backside-illuminated charge-coupled device (DBI-CCD) detector, real-time Dynamic Wavelength Stabilization™, and automatic dual viewing of the plasma torch. \r\nKey benefit: \r\n- Superior quantum efficiency, for enhanced analytical performance and superior detection limits\r\n- Simultaneous background correction, further improving analytical accuracy and  detection limits\r\n- Dynamic wavelength stabilization, increasing analytical reproducibility and reliability\r\nICP-OES is a versatile method by which elemental analysis can be done effectively on a variety of test samples containing a complex matrix or having a high level of dissolved solids for different application e.g.,  water quality and safety, soil analysis, Environmental and agro-chemical analysis, food safety, pharmaceutical analysis, Chemical analysis, Metallurgy analysis,  Materials sciences.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_323568347_3_2025_100005_ICP-OES-Instrument-21.jpg"
    },
    {
      "id": 23,
      "instrumentId": 0,
      "instrumentName": "Distilled Water (milli-Q water)",
      "categoryId": 0,
      "isActive": true,
      "description": null,
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg"
    }
  ];

  getAllInstruments(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.InstrumentsDataData = response.item1;
          this.tmpscifInstrumentsDataData = this.tmpsInstrumentsDataData = response.item1.slice(0, this.InstrumentsDataData.length);
          this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true);
          if (this.InstrumentId) {
            const matched = this.tmpscifInstrumentsDataData.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
            if (matched) {
              const effectiveCat = matched.categoryId ?? this.categoryId;
              this.fetchSpecifications(effectiveCat, this.InstrumentId);
            }
          }
        } else {
          this.InstrumentsDataData = this.DataItems;
          this.tmpscifInstrumentsDataData = this.tmpsInstrumentsDataData = this.InstrumentsDataData.slice(0, this.InstrumentsDataData.length);
          this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true);
          if (this.InstrumentId) {
            const matched = this.tmpscifInstrumentsDataData.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
            if (matched) {
              const effectiveCat = matched.categoryId ?? this.categoryId;
              this.fetchSpecifications(effectiveCat, this.InstrumentId);
            }
          }
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0);

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        this.InstrumentsDataData = this.DataItems; // added on 17-Feb-26 for static Instrument data when API fails
        this.tmpscifInstrumentsDataData = this.tmpsInstrumentsDataData = this.InstrumentsDataData.slice(0, this.InstrumentsDataData.length);
        this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
        this.loadingIndicator = false;
        console.error(err);
      }
    });
  }



  fetchSpecifications(categoryId: any, id: any): void {
    this.InstrumentId = id;

    const instrumentData = (this.tmpscifInstrumentsDataData && this.tmpscifInstrumentsDataData.length > 0)
      ? this.tmpscifInstrumentsDataData
      : this.DataItems;

    const immediateInstrument = instrumentData.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
    if (immediateInstrument) {
      this.instrumentName = immediateInstrument.instrumentName;
      this.ImageUrl = immediateInstrument.imageUrl;
      this.Description = immediateInstrument.description;
      this.isInstrumentActive = !!immediateInstrument.isActive;
      this.specifications = this.staticSpecifications.filter((spec: Specification) => spec.categoryId === categoryId);
      try { this.cdr.detectChanges(); } catch (e) { /* ignore detectChanges errors */ }
    }

    this.CIFwebService.fetchSpecifications().subscribe({
      next: (response: any) => {
        if (response.item1 && Array.isArray(response.item1) && response.item1.length > 0) {
          const allSpecifications: Specification[] = response.item1;
          const activeInstrument = instrumentData.some(
            (x: { isActive: boolean, id: any }) => x.isActive === true && x.id === this.InstrumentId
          );

          const instrument = instrumentData.find(
            (x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId
          );

          if (instrument) {
            this.instrumentName = instrument.instrumentName;
            this.ImageUrl = instrument.imageUrl;
            this.Description = instrument.description;
            this.isInstrumentActive = activeInstrument;
            this.specifications = allSpecifications.filter(
              (spec: Specification) => spec.categoryId === categoryId
            );
          } else {
            this.isInstrumentActive = true;
            this.specifications = allSpecifications.filter(
              (spec: Specification) => spec.categoryId === categoryId
            );
          }

          this.cdr.detectChanges();
        } else {
          this.setStaticSpecifications(categoryId);
        }
      },
      error: (err) => {
        console.error('Error fetching specifications:', err);
        this.setStaticSpecifications(categoryId);
      }
    });
  }

  private setStaticSpecifications(categoryId: number): void {
    const instrumentData = this.tmpscifInstrumentsDataData?.length > 0
      ? this.tmpscifInstrumentsDataData
      : this.DataItems;

    const instrument = instrumentData.find(
      (x: { id: any, instrumentName: string, categoryId: number }) => x.categoryId === categoryId
    );

    if (instrument) {
      this.instrumentName = instrument.instrumentName;
      this.ImageUrl = instrument.imageUrl;
      this.Description = instrument.description;
      this.isInstrumentActive = true;
      this.specifications = this.staticSpecifications.filter(
        (spec: Specification) => spec.categoryId === categoryId
      );
    } else {
      this.isInstrumentActive = true;
      const staticInstrument = this.DataItems.find(
        (item: { categoryId: number }) => item.categoryId === categoryId
      );
      if (staticInstrument) {
        this.instrumentName = staticInstrument.instrumentName;
        this.Description = staticInstrument.description;
        this.ImageUrl = staticInstrument.imageUrl;
      }
      this.specifications = this.staticSpecifications.filter(
        (spec: Specification) => spec.categoryId === categoryId
      );
    }

    this.cdr.detectChanges();
  }

  handleClick(instrument: any): void {
    if (!instrument || !instrument.isActive) {
      return;
    }
    this.fetchSpecifications(instrument.categoryId, instrument.id);
  }

  @ViewChild('chargesModal') chargesModal!: ElementRef;
  openChargesModal(id: any): void {
    this.getChargesDetails(id);
    this.modalService.open(this.chargesModal, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });
  }

  getChargesDetails(Id: any) {
    this.CIFwebService.GetChargesDetails(Id).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.cifInstrumentsCharges = response.item1;
          this.dataSource = response.item1;
          this.tmpscifInstrumentsCharges = response.item1;
          this.headHtmlData = this.tmpscifInstrumentsCharges[0];
          this.columns = Object.keys(this.tmpscifInstrumentsCharges[0]);
          this.columns = this.columns.filter((item: any) => item !== 'ResultFile' && item !== 'userId' && item !== 'id' && item !== 'analysisId');
          this.loadingIndicator = false;
        } else {
          this.cifInstrumentsCharges = [];
        }
      },
      error: err => {
        console.log(err);
      }
    });
  }

  navigateToLogin(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/Login']);
  }


  staticSpecifications: Specification[] = [
    { id: 1, categoryId: 1, keyName: 'Model', keyValue: 'JEOL JSM-7610F-PLUS', specificationType: 'General' },
    { id: 2, categoryId: 1, keyName: 'Resolution', keyValue: '1.0 nm at 15 kV', specificationType: 'Performance' },
    { id: 3, categoryId: 1, keyName: 'Magnification', keyValue: '25x to 1,000,000x', specificationType: 'Performance' },
    { id: 4, categoryId: 1, keyName: 'Accelerating Voltage', keyValue: '0.1 to 30 kV', specificationType: 'General' },
    { id: 5, categoryId: 2, keyName: 'Model', keyValue: 'Bruker D8 Advance', specificationType: 'General' },
    { id: 6, categoryId: 2, keyName: 'X-ray Source', keyValue: 'Cu Kα (λ = 1.5406 Å)', specificationType: 'General' },
    { id: 7, categoryId: 2, keyName: '2θ Range', keyValue: '0° to 160°', specificationType: 'Performance' },
    { id: 8, categoryId: 2, keyName: 'Detector', keyValue: 'LYNXEYE XE-T', specificationType: 'General' },
    { id: 9, categoryId: 3, keyName: 'Model', keyValue: 'Perkin Elmer Spectrum 2', specificationType: 'General' },
    { id: 10, categoryId: 3, keyName: 'Spectral Range', keyValue: '4000 - 400 cm⁻¹', specificationType: 'Performance' },
    { id: 11, categoryId: 3, keyName: 'Resolution', keyValue: '0.5 cm⁻¹', specificationType: 'Performance' },
    { id: 12, categoryId: 3, keyName: 'Accessory', keyValue: 'Diamond ATR', specificationType: 'General' },
    { id: 13, categoryId: 4, keyName: 'Model', keyValue: 'Perkin Elmer LS6500', specificationType: 'General' },
    { id: 14, categoryId: 4, keyName: 'Excitation Range', keyValue: '200 - 800 nm', specificationType: 'Performance' },
    { id: 15, categoryId: 4, keyName: 'Emission Range', keyValue: '200 - 900 nm', specificationType: 'Performance' },
    { id: 16, categoryId: 5, keyName: 'Model', keyValue: 'Perkin Elmer TGA 4000', specificationType: 'General' },
    { id: 17, categoryId: 5, keyName: 'Temperature Range', keyValue: 'Ambient to 1000°C', specificationType: 'Performance' },
    { id: 18, categoryId: 5, keyName: 'Heating Rate', keyValue: '0.1 - 200°C/min', specificationType: 'Performance' },
    { id: 19, categoryId: 6, keyName: 'Model', keyValue: 'Perkin Elmer DSC 6000', specificationType: 'General' },
    { id: 20, categoryId: 6, keyName: 'Temperature Range', keyValue: '-180°C to 750°C', specificationType: 'Performance' },
    { id: 21, categoryId: 6, keyName: 'Heating Rate', keyValue: '0.01 - 100°C/min', specificationType: 'Performance' },
    { id: 22, categoryId: 7, keyName: 'Model', keyValue: 'Shimadzu GCMS TQ8040 NX', specificationType: 'General' },
    { id: 23, categoryId: 7, keyName: 'Mass Range', keyValue: '1.5 - 1100 m/z', specificationType: 'Performance' },
    { id: 24, categoryId: 7, keyName: 'Ionization', keyValue: 'EI (Electron Ionization)', specificationType: 'General' },
    { id: 25, categoryId: 8, keyName: 'Model', keyValue: 'Shimadzu Prominence LPGE', specificationType: 'General' },
    { id: 26, categoryId: 8, keyName: 'Detectors', keyValue: 'PDA, RID', specificationType: 'General' },
    { id: 27, categoryId: 8, keyName: 'Flow Rate', keyValue: '0.001 - 10 mL/min', specificationType: 'Performance' },
    { id: 28, categoryId: 9, keyName: 'Model', keyValue: 'Metrohm Autolab AUT.MAC.204', specificationType: 'General' },
    { id: 29, categoryId: 9, keyName: 'Channels', keyValue: 'Multi-Channel', specificationType: 'General' },
    { id: 30, categoryId: 9, keyName: 'Frequency Range', keyValue: '10 µHz to 32 MHz', specificationType: 'Performance' },
    { id: 31, categoryId: 10, keyName: 'Model', keyValue: 'Axis Density Meter ALN-220', specificationType: 'General' },
    { id: 32, categoryId: 10, keyName: 'Balance Type', keyValue: 'Analytical', specificationType: 'General' },
    { id: 33, categoryId: 11, keyName: 'Model', keyValue: 'Eppendorf 5804R', specificationType: 'General' },
    { id: 34, categoryId: 11, keyName: 'Max Speed', keyValue: '14,000 rpm', specificationType: 'Performance' },
    { id: 35, categoryId: 11, keyName: 'Temperature Range', keyValue: '-9°C to 40°C', specificationType: 'Performance' },
    { id: 36, categoryId: 12, keyName: 'Model', keyValue: 'LABMAN LMDV-200', specificationType: 'General' },
    { id: 37, categoryId: 12, keyName: 'Speed Range', keyValue: '0.3 - 100 rpm', specificationType: 'Performance' },
    { id: 38, categoryId: 13, keyName: 'Model', keyValue: 'Malvern Zetasizer Nano ZS90', specificationType: 'General' },
    { id: 39, categoryId: 13, keyName: 'Size Range', keyValue: '0.3 nm - 10 µm', specificationType: 'Performance' },
    { id: 40, categoryId: 13, keyName: 'Laser', keyValue: '633 nm He-Ne', specificationType: 'General' },
    { id: 41, categoryId: 14, keyName: 'Model', keyValue: 'Shimadzu UV-1800', specificationType: 'General' },
    { id: 42, categoryId: 14, keyName: 'Wavelength Range', keyValue: '190 - 1100 nm', specificationType: 'Performance' },
    { id: 43, categoryId: 14, keyName: 'Resolution', keyValue: '1 nm', specificationType: 'Performance' },
    { id: 44, categoryId: 15, keyName: 'Model', keyValue: 'PerkinElmer Optima 8000', specificationType: 'General' },
    { id: 45, categoryId: 15, keyName: 'Detector', keyValue: 'DBI-CCD Array', specificationType: 'General' },
    { id: 46, categoryId: 15, keyName: 'Wavelength Range', keyValue: '165 - 850 nm', specificationType: 'Performance' }
  ];

  faqs: FAQ[] = [
    {
      question: 'Field Emission Scanning Electron Microscope (FE SEM)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How many samples can be submitted in a single request form?</dt>
              <dd><strong>Ans:</strong> Maximum of 5 samples</dd>
              <dt><strong>Q2:</strong> Does the Gold sputtering process affect the sample?</dt>
              <dd><strong>Ans:</strong> No, the process only creates a very thin coating on the sample surface to enhance the conductivity for good imaging.</dd>
              <dt><strong>Q3:</strong> What amount of sample is required for FESEM?</dt>
              <dd><strong>Ans:</strong> Powder: Minimum of 2.5 to 5mg. Film: Maximum allowed size 1cm x 1cm.</dd>
              <dt><strong>Q4:</strong> How will we come to know about the slot allocation?</dt>
              <dd><strong>Ans:</strong> The concerned operator/office assistant will intimate you at least a week before your slot by calling you.</dd>
            </dl>
          `
    },
    {
      question: 'UV-Vis Spectrophotometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What wavelength range is used for your UV-Vis instrument?</dt>
              <dd><strong>Ans:</strong> 200 nm to 800 nm</dd>
              <dt><strong>Q2:</strong> Can I reuse the sample after the analysis for other experiments?</dt>
              <dd><strong>Ans:</strong> Yes, if your sample is not UV sensitive you can reuse it. UV-Vis spectrometer analysis is a non-destructive method.</dd>
              <dt><strong>Q3:</strong> Is it necessary to provide final dilution of sample for UV analysis?</dt>
              <dd><strong>Ans:</strong> Yes, user must provide the sample in final diluted form.</dd>
            </dl>
          `
    },
    {
      question: 'Thermogravimetric Analysis (TGA)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How much sample is required for TGA analysis?</dt>
              <dd><strong>Ans:</strong> 5–8mg</dd>
              <dt><strong>Q2:</strong> What is the normally used heating rate in TGA analysis?</dt>
              <dd><strong>Ans:</strong> 10°C/Min</dd>
              <dt><strong>Q3:</strong> Can we do TGA analysis of Liquid samples?</dt>
              <dd><strong>Ans:</strong> No! TGA analysis can only be performed on Powder or Film samples.</dd>
              <dt><strong>Q4:</strong> What is the maximum possible heating range of the TGA instrument available in CIF?</dt>
              <dd><strong>Ans:</strong> 1000°C</dd>
            </dl>
          `
    },
    {
      question: 'Differential Scanning Calorimeter (DSC)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> How much sample is required for DSC analysis?</dt>
              <dd><strong>Ans:</strong> 8–10mg</dd>
              <dt><strong>Q2:</strong> Which gases are used for the analysis process?</dt>
              <dd><strong>Ans:</strong> Nitrogen</dd>
              <dt><strong>Q3:</strong> Which type of sample pan is used in DSC?</dt>
              <dd><strong>Ans:</strong> Aluminium type</dd>
            </dl>
          `
    },
    {
      question: 'Powder X-ray Diffractometer (XRD)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can I use the sample after XRD analysis?</dt>
              <dd><strong>Ans:</strong> Yes! XRD is non-destructive. The sample can be reused.</dd>
              <dt><strong>Q2:</strong> I have an unknown mineral sample. Can I use XRD to identify it?</dt>
              <dd><strong>Ans:</strong> Yes! XRD can identify crystal patterns or phases. For better results, run XRF first to know composition.</dd>
              <dt><strong>Q3:</strong> Which databases are available?</dt>
              <dd><strong>Ans:</strong> ICSD, PDF2 ICDD (JCPDS), Software: Highscore Plus</dd>
              <dt><strong>Q4:</strong> What amount of sample is required?</dt>
              <dd><strong>Ans:</strong> Powder: Minimum 400–500 mg</dd>
            </dl>
          `
    },
    {
      question: 'FTIR Spectrometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
              <dd><strong>Ans:</strong> Powder and Liquid samples</dd>
              <dt><strong>Q2:</strong> Can we analyze liquid samples?</dt>
              <dd><strong>Ans:</strong> Yes</dd>
              <dt><strong>Q3:</strong> In which ranges can we obtain IR spectra?</dt>
              <dd><strong>Ans:</strong> 4000–400 cm-1</dd>
              <dt><strong>Q4:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> 5–10 mg</dd>
            </dl>
          `
    },
    {
      question: 'Gas Chromatography with Mass Spectrometry (GC-MS/MS)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can gas samples be analyzed?</dt>
              <dd><strong>Ans:</strong> No, only solid and liquid samples</dd>
              <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
              <dt><strong>Q3:</strong> Are results provided with library comparison?</dt>
              <dd><strong>Ans:</strong> Yes, NIST library comparison data is provided</dd>
              <dt><strong>Q4:</strong> Can direct injection mass spectra be obtained?</dt>
              <dd><strong>Ans:</strong> Yes, using MS/MS in CIF</dd>
            </dl>
          `
    },
    {
      question: 'High Performance Liquid Chromatography (HPLC)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What is the minimum quantity required?</dt>
              <dd><strong>Ans:</strong> Powder: 5–10 mg; Liquid: Minimum 2 ml final dilution</dd>
              <dt><strong>Q2:</strong> Do I have to submit reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
              <dt><strong>Q3:</strong> What detectors are available?</dt>
              <dd><strong>Ans:</strong> PDA (Photo Diode Array), RID (Refractive Index Detector)</dd>
            </dl>
          `
    },
    {
      question: 'Particle Size Analyser (Zetasizer Nano)',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What are some specifications?</dt>
              <dd><strong>Ans:</strong> Laser λ=633 nm, Temp 2°C–90°C</dd>
              <dt><strong>Q2:</strong> What cuvettes are available?</dt>
              <dd><strong>Ans:</strong> Quartz low volume, Disposable polystyrene, Folded capillary cuvettes</dd>
              <dt><strong>Q3:</strong> What sample volume is needed?</dt>
              <dd><strong>Ans:</strong> 1 ml (polystyrene), 0.75 ml (capillary), 12 μL (quartz)</dd>
              <dt><strong>Q4:</strong> What is a good concentration?</dt>
              <dd><strong>Ans:</strong> Depends on particle properties and polydispersity</dd>
            </dl>
          `
    },
    {
      question: 'Fluorescence Spectrometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What type of samples can be analyzed?</dt>
              <dd><strong>Ans:</strong> Powder and Liquid</dd>
              <dt><strong>Q2:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> Powder: 200 mg; Liquid: 2 ml</dd>
              <dt><strong>Q3:</strong> Do I need excitation/emission ranges?</dt>
              <dd><strong>Ans:</strong> Yes, must be provided</dd>
              <dt><strong>Q4:</strong> What if I don’t know the wavelength region?</dt>
              <dd><strong>Ans:</strong> Run UV spectroscopy first; fluorescence follows UV peaks</dd>
            </dl>
          `
    },
    {
      question: 'ICP-OES',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Should I submit final dilution?</dt>
              <dd><strong>Ans:</strong> Yes, only final diluted sample with digestion is accepted</dd>
              <dt><strong>Q2:</strong> What is the minimum quantity required?</dt>
              <dd><strong>Ans:</strong> 40–50 ml final dilution</dd>
              <dt><strong>Q3:</strong> Do I need reference standards?</dt>
              <dd><strong>Ans:</strong> Yes, required for quantitative analysis</dd>
            </dl>
          `
    },
    {
      question: 'Electrochemical Workstation',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> What areas are covered?</dt>
              <dd><strong>Ans:</strong> Supercapacitors, Batteries, Biosensors, Corrosion, Electrodepositions</dd>
              <dt><strong>Q2:</strong> Do you provide photo-sensitive measurements?</dt>
              <dd><strong>Ans:</strong> No, light source not available</dd>
              <dt><strong>Q3:</strong> Which electrodes are provided?</dt>
              <dd><strong>Ans:</strong> Ag/AgCl, Platinum wire, Glass carbon, Carbon electrodes</dd>
              <dt><strong>Q4:</strong> Do I need to provide parameters?</dt>
              <dd><strong>Ans:</strong> Yes, must be provided</dd>
              <dt><strong>Q5:</strong> Do you prepare working electrodes?</dt>
              <dd><strong>Ans:</strong> Normally provided by user; may be prepared with extra charges</dd>
              <dt><strong>Q6:</strong> Can I reuse samples?</dt>
              <dd><strong>Ans:</strong> Depends case by case; ask operator</dd>
            </dl>
          `
    },
    {
      question: 'Viscometer',
      isOpen: false,
      answer: `
            <dl>
              <dt><strong>Q1:</strong> Can I analyse solid samples?</dt>
              <dd><strong>Ans:</strong> No, only liquids (free-flowing or slightly viscous)</dd>
              <dt><strong>Q2:</strong> Can I analyse liquid samples at high temperature?</dt>
              <dd><strong>Ans:</strong> No, only ambient temperature</dd>
              <dt><strong>Q3:</strong> How much sample is required?</dt>
              <dd><strong>Ans:</strong> At least 40–50 ml liquid</dd>
            </dl>
          `
    }
  ];

  toggleAccordion(selectedFaq: FAQ): void {
    selectedFaq.isOpen = !selectedFaq.isOpen;
    this.faqs.forEach(faq => {
      if (faq !== selectedFaq) faq.isOpen = false;
    });
    this.cdr.detectChanges();
  }

  goto(val: any): void {
    this.router.navigateByUrl(val);
  }





  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
      html: `
           <address>
            <div class="contact-text">
           Central Instrumentation Facility (CIF) <br/>
          Lovely Professional University <br/>
          Block-38, Room No.106 <br/>
          Jalandhar - Delhi G.T. Road, <br/>
          Phagwara, Punjab (India) - 144411 <br/>
          Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
          Email : cif@lpu.co.in<br>
          </div>
           </address>`,
      icon: 'info'
    });


  }
  loadingStates: boolean[] = [];

  VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigate([Sufix, name, Id, catId]);
  }
  onImageLoad(index: number): void {
    this.loadingStates[index] = false;
  }



  onImageError(event: any, index: number): void {
    event.target.src = '/image.jpg';
    this.loadingStates[index] = false;
  }

  InstrumentsDataData: any[] = [];
  tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
  getAllInstrumentss(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.InstrumentsDataData = response.item1;
          this.tmpsInstrumentsDataData = response.item1.slice(0, this.InstrumentsDataData.length);
          this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
          if (this.InstrumentId) {
            const matched = this.tmpsInstrumentsDataData.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
            if (matched) {
              const effectiveCat = matched.categoryId ?? this.categoryId;
              this.fetchSpecifications(effectiveCat, this.InstrumentId);
            }
          }
        } else {
          this.InstrumentsDataData = [];
          if (this.InstrumentId) {
            const matched = this.DataItems.find((x: any) => x.id == this.InstrumentId || x.instrumentId == this.InstrumentId);
            if (matched) {
              const effectiveCat = matched.categoryId ?? this.categoryId;
              this.fetchSpecifications(effectiveCat, this.InstrumentId);
            }
          }
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        this.loadingIndicator = false;
        console.error(err);
      }
    });
  }


  // added on 21-aug-25
  chunkedEvents: any[][] = [];

  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }
}



