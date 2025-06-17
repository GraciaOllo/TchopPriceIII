import express from 'express';

const router = express.Router();

// Cameroon regions and major cities
const cameroonRegions = [
  {
    name: 'Adamawa',
    cities: ['Ngaoundéré', 'Tibati', 'Tignère', 'Banyo', 'Meiganga']
  },
  {
    name: 'Centre',
    cities: ['Yaoundé', 'Mbalmayo', 'Obala', 'Bafia', 'Ntui']
  },
  {
    name: 'East',
    cities: ['Bertoua', 'Batouri', 'Yokadouma', 'Abong-Mbang', 'Kenzou']
  },
  {
    name: 'Far North',
    cities: ['Maroua', 'Garoua', 'Mokolo', 'Waza', 'Yagoua']
  },
  {
    name: 'Littoral',
    cities: ['Douala', 'Edéa', 'Nkongsamba', 'Loum', 'Manjo']
  },
  {
    name: 'North',
    cities: ['Garoua', 'Ngaoundéré', 'Poli', 'Tcholliré', 'Guider']
  },
  {
    name: 'Northwest',
    cities: ['Bamenda', 'Kumbo', 'Wum', 'Ndop', 'Bafut']
  },
  {
    name: 'South',
    cities: ['Ebolowa', 'Kribi', 'Sangmélima', 'Ambam', 'Djoum']
  },
  {
    name: 'Southwest',
    cities: ['Buea', 'Limbe', 'Kumba', 'Mamfe', 'Tiko']
  },
  {
    name: 'West',
    cities: ['Bafoussam', 'Dschang', 'Mbouda', 'Bandjoun', 'Foumban']
  }
];

// Get all regions
router.get('/', (req, res) => {
  res.json({ regions: cameroonRegions });
});

export default router;