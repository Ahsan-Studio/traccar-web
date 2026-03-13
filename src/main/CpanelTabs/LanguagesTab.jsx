import { Typography, TextField } from '@mui/material';
import { sectionHeading, selectFieldSx } from './cpanelTabHelpers';

const LanguagesTab = ({ attr, updateAttribute }) => (
  <>
    <Typography sx={sectionHeading}>Languages</Typography>
    <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mb: 2 }}>
      Manage available languages for the application. Languages are configured via the server translation system.
    </Typography>
    <TextField
      label="Default Language" size="small" fullWidth select
      value={attr('defaultLanguage') || 'en'}
      onChange={(e) => updateAttribute('defaultLanguage', e.target.value)}
      sx={selectFieldSx}
      SelectProps={{ native: true }}
    >
      {[
        { code: 'en', name: 'English' }, { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'ar', name: 'Arabic' }, { code: 'zh', name: 'Chinese' },
        { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
        { code: 'hi', name: 'Hindi' }, { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
        { code: 'ms', name: 'Malay' }, { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' }, { code: 'es', name: 'Spanish' },
        { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' },
        { code: 'vi', name: 'Vietnamese' },
      ].map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
    </TextField>
    <Typography variant="body2" sx={{ fontSize: 11, color: '#999', mt: 2 }}>
      Additional language files can be added to the server's translation directory. Restart the server after adding new language files.
    </Typography>
  </>
);

export default LanguagesTab;
