import mongoose from 'mongoose';

const { Schema } = mongoose;

// Journal entry numbers must be unique and gapless, so they come from an atomic
// counter rather than the random-suffix scheme used for booking ids.
const ledgerSequenceSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const LedgerSequence = mongoose.model('LedgerSequence', ledgerSequenceSchema);
export default LedgerSequence;
