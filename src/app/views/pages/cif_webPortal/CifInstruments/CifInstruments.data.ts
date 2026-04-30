import { Specification } from './specification.model';

export interface FAQ {
  question: string;
  isOpen: boolean;
  answer: string;
}

export interface InstrumentItem {
  id: number;
  instrumentId: number;
  instrumentName: string;
  categoryId: number;
  isActive: boolean;
  description: string | null;
  imageUrl: string;
}

export interface ChargeItem {
  orgTypeId: number;
  sampleText: string;
  price: number;
}

export const STATIC_INSTRUMENTS: InstrumentItem[] = [
  { id: 1, instrumentId: 0, categoryId: 1, isActive: true, instrumentName: 'Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS', description: 'The Jeol field emission scanning electron microscope is a versatile high resolution scanning electron microscope…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG' },
  { id: 2, instrumentId: 0, categoryId: 2, isActive: true, instrumentName: 'Powder XRD (Bruker D8 Advance)', description: 'This Bruker equipment benchmark when it comes to extracting structural information from X-Ray Powder Diffraction…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG' },
  { id: 3, instrumentId: 0, categoryId: 3, isActive: true, instrumentName: 'FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)', description: 'In Infrared spectroscopy or vibrational spectroscopy is used to study the chemical composition of a sample…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG' },
  { id: 4, instrumentId: 0, categoryId: 4, isActive: true, instrumentName: 'Fluorescence Spectrometer (Perkin Elmer LS6500)', description: 'Fluorescence spectrophotometry is a technique that analyse the state of sample…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG' },
  { id: 5, instrumentId: 0, categoryId: 5, isActive: true, instrumentName: 'Thermogravimetric analyzer (Perkin Elmer TGA 4000)', description: 'Thermogravimetric analysis is an equipment that measures the change in weight…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG' },
  { id: 6, instrumentId: 0, categoryId: 6, isActive: true, instrumentName: 'Differential scanning calorimeter (Perkin Elmer DSC 6000)', description: 'Differential Scanning Calorimetry is a thermal analysis technique…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG' },
  { id: 9, instrumentId: 0, categoryId: 7, isActive: true, instrumentName: 'Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX', description: 'The Gas Chromatograph - Mass Spectrometer, Shimadzu…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG' },
  { id: 10, instrumentId: 0, categoryId: 8, isActive: true, instrumentName: 'High Performance and Liquid Chromatography, Shimadzu Prominence LPGE', description: 'This Shimadzu equipment is used in the analysis of pharmaceutical…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG' },
  { id: 11, instrumentId: 0, categoryId: 9, isActive: true, instrumentName: 'Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204', description: 'Metrohum is a multi-channel Potentiostat/galvanostat…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG' },
  { id: 12, instrumentId: 0, categoryId: 10, isActive: true, instrumentName: 'Density merer (Axis Density Meter with analytical balance ALN-220)', description: 'Density Meter with analytical balance…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_382530855_2_2025_100002_Density_Meter-Instrument.jpg' },
  { id: 13, instrumentId: 0, categoryId: 11, isActive: true, instrumentName: 'Refrigerated Centrifuge (Eppendorf 5804R)', description: 'Refrigerated Centrifuge is a high speed centrifuge for medium capacity needs…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_259413724_2_2025_100003_Refrigerated_Centirfuge-Instrument.JPG' },
  { id: 14, instrumentId: 0, categoryId: 12, isActive: true, instrumentName: 'Viscometer (LABMAN model of LMDV-200 with small sample adaptor low viscosity adaptor and software.)', description: 'This Labman machine is Rotational Digital Direct Reading Viscometer…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_696381150_2_2025_100001_ADP_2298---.JPG' },
  { id: 15, instrumentId: 0, categoryId: 13, isActive: true, instrumentName: 'Particle size and Zeta potential analyzer (Malverrn Zetasizer Nano ZS90)', description: 'Light scattering is a fundamental analytical technique…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_284316046_2_2025_100010_Particle_Size-Instrument.JPG' },
  { id: 21, instrumentId: 0, categoryId: 14, isActive: true, instrumentName: 'Shimadzu UV-1800 UV-Vis', description: 'The UV-1800 is an advanced high-resolution spectrophotometer…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_1208223655_17_2025_100004_-14-UV.JPG' },
  { id: 22, instrumentId: 0, categoryId: 15, isActive: true, instrumentName: 'ICP-OES, PerkinElmer Optima 8000', description: 'The Optima 8000 is a bench-top, dual-view ICP-OES…', imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_323568347_3_2025_100005_ICP-OES-Instrument-21.jpg' },
  { id: 23, instrumentId: 0, categoryId: 0, isActive: true, instrumentName: 'Distilled Water (milli-Q water)', description: null, imageUrl: 'https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg' },
]; 

export const STATIC_SPECIFICATIONS: Specification[] = [
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
  { id: 46, categoryId: 15, keyName: 'Wavelength Range', keyValue: '165 - 850 nm', specificationType: 'Performance' },
]; 