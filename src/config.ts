// College settings. Edit this file to brand the tool for your institution.
export const COLLEGE = {
  name: 'Indian Institute of Technology Tirupati', // shown in the header and pre-filled in the first Education entry
  location: '',                                    // optional: pre-filled as the Education location (empty by default)
  logo: `${import.meta.env.BASE_URL}assets/logo.png`, // official logo: replace public/assets/logo.png
  degrees: [                                       // suggestions in the Degree field
    'B.Tech in Computer Science and Engineering',
    'B.Tech in Information Technology',
    'B.Tech in Electronics and Communication Engineering',
    'B.Tech in Electrical and Electronics Engineering',
    'B.Tech in Mechanical Engineering',
    'B.Tech in Civil Engineering',
    'M.Tech',
    'MBA',
    'MCA',
    'BCA',
    'B.Sc',
    'B.Com',
  ],
}
