import { BrandItem } from '../types';

export const brandsList: BrandItem[] = [
  // ================= 1. الهواتف والتكنولوجيا =================
  {
    id: 'apple',
    name: 'Apple',
    displayName: 'Apple آبل',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    categoryIds: ['phones', 'laptops', 'accessories'],
    sector: 'phones'
  },
  {
    id: 'samsung',
    name: 'Samsung',
    displayName: 'Samsung سامسونج',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    categoryIds: ['phones', 'monitors', 'audio'],
    sector: 'phones'
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    displayName: 'Xiaomi شاومي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg',
    categoryIds: ['phones', 'accessories'],
    sector: 'phones'
  },
  {
    id: 'huawei',
    name: 'Huawei',
    displayName: 'Huawei هواوي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Huawei_logo.svg',
    categoryIds: ['phones', 'laptops', 'audio'],
    sector: 'phones'
  },
  {
    id: 'honor',
    name: 'Honor',
    displayName: 'Honor هونر',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Honor_Logo_2022.svg',
    categoryIds: ['phones', 'laptops'],
    sector: 'phones'
  },
  {
    id: 'realme',
    name: 'Realme',
    displayName: 'Realme ريلمي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Realme_logo.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'tecno',
    name: 'Tecno',
    displayName: 'Tecno تكنو',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Tecno_Mobile_logo.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'infinix',
    name: 'Infinix',
    displayName: 'Infinix إنفينيكس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Infinix_logo.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'oneplus',
    name: 'OnePlus',
    displayName: 'OnePlus ون بلس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/OP_LU_Reg_1L_RGB_red_pos.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'google-pixel',
    name: 'Google Pixel',
    displayName: 'Google Pixel جوجل',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'sony',
    name: 'Sony',
    displayName: 'Sony سوني',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
    categoryIds: ['audio', 'gaming', 'phones', 'cameras'],
    sector: 'phones'
  },
  {
    id: 'motorola',
    name: 'Motorola',
    displayName: 'Motorola موتورولا',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Motorola_new_logo.svg',
    categoryIds: ['phones'],
    sector: 'phones'
  },
  {
    id: 'asus',
    name: 'Asus',
    displayName: 'Asus أسوس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg',
    categoryIds: ['laptops', 'monitors', 'phones'],
    sector: 'phones'
  },
  {
    id: 'lenovo',
    name: 'Lenovo',
    displayName: 'Lenovo لينوفو',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg',
    categoryIds: ['laptops', 'phones'],
    sector: 'phones'
  },

  // ================= 2. القيمنق واللابتوبات =================
  {
    id: 'msi',
    name: 'MSI',
    displayName: 'MSI إم إس آي',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/MSI_Logo.svg',
    categoryIds: ['monitors', 'laptops'],
    sector: 'gaming'
  },
  {
    id: 'razer',
    name: 'Razer',
    displayName: 'Razer رايزر',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Razer_Wordmark.svg',
    categoryIds: ['accessories', 'laptops', 'audio'],
    sector: 'gaming'
  },
  {
    id: 'corsair',
    name: 'Corsair',
    displayName: 'Corsair كورسير',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Corsair_Components_logo.svg',
    categoryIds: ['accessories', 'chairs', 'gaming'],
    sector: 'gaming'
  },
  {
    id: 'logitech',
    name: 'Logitech',
    displayName: 'Logitech لوجيتك',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg',
    categoryIds: ['accessories', 'gaming'],
    sector: 'gaming'
  },
  {
    id: 'hyperx',
    name: 'HyperX',
    displayName: 'HyperX هايبر إكس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/HyperX_logo.svg',
    categoryIds: ['audio', 'accessories', 'gaming'],
    sector: 'gaming'
  },
  {
    id: 'rog',
    name: 'ROG',
    displayName: 'ROG جمهورية اللاعبين',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/ASUS_ROG_Logo.svg',
    categoryIds: ['laptops', 'monitors', 'phones'],
    sector: 'gaming'
  },
  {
    id: 'alienware',
    name: 'Alienware',
    displayName: 'Alienware إلين وير',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Alienware_wordmark.svg',
    categoryIds: ['laptops', 'monitors'],
    sector: 'gaming'
  },
  {
    id: 'steelseries',
    name: 'SteelSeries',
    displayName: 'SteelSeries ستيل سيريز',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Steelseries_Logo.svg',
    categoryIds: ['accessories', 'audio'],
    sector: 'gaming'
  },
  {
    id: 'dxracer',
    name: 'DXRacer',
    displayName: 'DXRacer دي إكس ريسر',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/DXRacer_logo.svg',
    categoryIds: ['chairs'],
    sector: 'gaming'
  },
  {
    id: 'furgle',
    name: 'Furgle',
    displayName: 'Furgle فورغل قيمنق',
    logo: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=120&q=80',
    categoryIds: ['chairs'],
    sector: 'gaming'
  },
  {
    id: 'cougar',
    name: 'Cougar',
    displayName: 'Cougar كوغار',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Cougar_Gaming_Logo.svg',
    categoryIds: ['chairs', 'accessories'],
    sector: 'gaming'
  },
  {
    id: 'redragon',
    name: 'Redragon',
    displayName: 'Redragon ريدراجون',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Redragon_logo.png',
    categoryIds: ['accessories'],
    sector: 'gaming'
  },
  {
    id: 'nintendo',
    name: 'Nintendo',
    displayName: 'Nintendo نينتندو',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg',
    categoryIds: ['gaming'],
    sector: 'gaming'
  },
  {
    id: 'playstation',
    name: 'PlayStation',
    displayName: 'PlayStation بلايستيشن',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg',
    categoryIds: ['gaming'],
    sector: 'gaming'
  },
  {
    id: 'xbox',
    name: 'Xbox',
    displayName: 'Xbox إكس بوكس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg',
    categoryIds: ['gaming'],
    sector: 'gaming'
  },
  {
    id: 'valve',
    name: 'Valve',
    displayName: 'Valve ستيم ديك',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Valve_logo.svg',
    categoryIds: ['gaming'],
    sector: 'gaming'
  },

  // ================= 3. الصوتيات والاكسسوارات =================
  {
    id: 'anker',
    name: 'Anker',
    displayName: 'Anker أنكر',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Anker_logo.svg',
    categoryIds: ['chargers', 'accessories', 'audio'],
    sector: 'audio'
  },
  {
    id: 'jbl',
    name: 'JBL',
    displayName: 'JBL جي بي إل',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/JBL_logo.svg',
    categoryIds: ['audio'],
    sector: 'audio'
  },
  {
    id: 'bose',
    name: 'Bose',
    displayName: 'Bose بوز',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bose_logo.svg',
    categoryIds: ['audio'],
    sector: 'audio'
  },
  {
    id: 'beats',
    name: 'Beats',
    displayName: 'Beats بيتس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Beats_Electronics_logo.svg',
    categoryIds: ['audio'],
    sector: 'audio'
  },
  {
    id: 'soundcore',
    name: 'Soundcore',
    displayName: 'Soundcore ساوندكور',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Anker_logo.svg',
    categoryIds: ['audio'],
    sector: 'audio'
  },
  {
    id: 'baseus',
    name: 'Baseus',
    displayName: 'Baseus باسيوس',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Baseus_logo.svg',
    categoryIds: ['chargers', 'accessories'],
    sector: 'audio'
  },
  {
    id: 'wiwu',
    name: 'WiWU',
    displayName: 'WiWU وي وو',
    logo: 'https://via.placeholder.com/120x60/ffffff/6C5CE7?text=WiWU',
    categoryIds: ['accessories', 'chargers'],
    sector: 'audio'
  },
  {
    id: 'yesido',
    name: 'Yesido',
    displayName: 'Yesido يسيدو',
    logo: 'https://via.placeholder.com/120x60/ffffff/6C5CE7?text=Yesido',
    categoryIds: ['accessories', 'chargers'],
    sector: 'audio'
  },
  {
    id: 'momax',
    name: 'Momax',
    displayName: 'Momax موماكس',
    logo: 'https://via.placeholder.com/120x60/ffffff/6C5CE7?text=Momax',
    categoryIds: ['chargers', 'accessories'],
    sector: 'audio'
  },
  {
    id: 'joyroom',
    name: 'Joyroom',
    displayName: 'Joyroom جوي روم',
    logo: 'https://via.placeholder.com/120x60/ffffff/6C5CE7?text=Joyroom',
    categoryIds: ['chargers', 'audio'],
    sector: 'audio'
  },
  {
    id: 'ugreen',
    name: 'Ugreen',
    displayName: 'Ugreen يوجرين',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Ugreen_Logo.svg',
    categoryIds: ['chargers', 'accessories'],
    sector: 'audio'
  },
  {
    id: 'sandisk',
    name: 'SanDisk',
    displayName: 'SanDisk سان ديسك',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/SanDisk_logo.svg',
    categoryIds: ['accessories'],
    sector: 'audio'
  }
];
