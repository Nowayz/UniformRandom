
class UniformRandom {
    mutationSeed  = new Uint32Array(31).fill(null); // Random seed values control order of mutations
    sequenceIndex = 0; // Index in the random sequence
    maxBitIndex   = 0; // Index of the highest bit required to represent maxValue (eg. maxValue is 11, maxBitIndex is 3)
    maxValue      = 0; // Highest value in the random sequence
    bitMask       = 0; // Bitmask whose length is maxBitIndex+1  (eg. maxBitIndex is 3, bitMask is 0b1111)
    numBits       = 0; // Number of bits in bitMask (basically maxBitIndex+1; to prevent adding 1 repeatedly elsewhere)
    numMaskValues = 0; // Number of values that can be repesented by numBits bits
    
    constructor(range) {
      this.randomize(range);
    }

    reset = () => {
      this.sequenceIndex = 0;
      crypto.getRandomValues(this.mutationSeed);
    }

    generate(forward) {
      let result = this.maxValue;
      for (let i = 0; (i < this.numMaskValues) && (result >= this.maxValue); ++i) {
        this.sequenceIndex = (this.sequenceIndex + (forward?1:-1)) % this.numMaskValues;
        result = this.sequenceIndex;
        for (let j = 0; j < this.mutationSeed.length; ++j) {
          result = (((result << 1) & this.bitMask) | ((result >>> (this.numBits - 1)) & this.bitMask));
          let seedInt = this.mutationSeed[j];
          for (let k = 0; k < this.maxBitIndex; ++k) {
            const opArg = (seedInt + j + k);
            switch (seedInt & 3) {
              case 0:{
                let reversedBits = 0;
                for(let bitIndex = this.numBits; bitIndex--;)
                    reversedBits |= ((result>>>(this.maxBitIndex-bitIndex))&1)<<bitIndex;
                result = reversedBits;
                break;
              }
              case 1: {
                let n = opArg%this.maxBitIndex;
                result = (((result << n) & this.bitMask) | ((result >>> (this.numBits - n)) & this.bitMask));
                break;
              }
              case 2:
                result = (result + opArg) & this.bitMask;
                break;
              case 3:
                result = (result ^ opArg) & this.bitMask;
                break;
            }
            seedInt >>>= 1;
          }
        }
      }
      return result;
    }

    randomize = (range) => {
        this.maxValue = range;
        this.numMaskValues  = range - 1;
        this.numMaskValues |= this.numMaskValues >> 1;
        this.numMaskValues |= this.numMaskValues >> 2;
        this.numMaskValues |= this.numMaskValues >> 4;
        this.numMaskValues |= this.numMaskValues >> 8;
        this.numMaskValues |= this.numMaskValues >> 16;
        this.numMaskValues++;
        this.bitMask = this.numMaskValues - 1;
        this.maxBitIndex = 32;

        let v = this.numMaskValues & -this.numMaskValues;
        if (v) this.maxBitIndex--;
        if (v & 0x0000FFFF) this.maxBitIndex -= 16;
        if (v & 0x00FF00FF) this.maxBitIndex -= 8;
        if (v & 0x0F0F0F0F) this.maxBitIndex -= 4;
        if (v & 0x33333333) this.maxBitIndex -= 2;
        if (v & 0x55555555) this.maxBitIndex -= 1;
        this.maxBitIndex--;
        this.numBits = this.maxBitIndex + 1;
        
        this.reset();
    }

    next = ()=>this.generate(true);
    prev = ()=>this.generate(false);
}
